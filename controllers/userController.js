const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  sendMail,
  generateOTP,
  generateRandomCode,
} = require("./emailController");
const {
  createUser,
  findUserByEmail,
  findUserById,
  findUserAndAddOTPCode,
  findUserAndVerifyOTPCode,
  updateUserProfile,
  DeleteUser,
} = require("../helpers/userHelper"); // Import userHelper

const jwtSecretKey = process.env.JWT_SECRET_KEY;

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if the user already exists in the database
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user and save to the database using the helper function
    const newUser = await createUser(name, email, password,'user');

    // Create and return a JWT token for the registered user
    const token = jwt.sign({ userId: newUser._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login a user
const loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find the user by email using the helper function
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create and return a JWT token for the logged-in user
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//send otp
const sendOtp = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    const code = generateRandomCode(6); // Generate a 6-digit OTP
    const result = await findUserAndAddOTPCode(userId, code); // Add the OTP to the user's document in the database

    if (!result.user) {
      return res
        .status(400)
        .json({ message: "User not found or user is already verified" });
    }

    const emailResult = await sendMail(
      result.user.email,
      "OTP Verification",
      `Verify Your Account`,
      `
          <div class="container">
            <div class="card">
              <h3>Verify Your Account</h3>
              <br>
              <a href="${process.env.DOMAIN}/api/user/verify-otp?code=${code}&uid=${req.user.userId}">
                <button>Verify</button>
              </a>
            </div>
          </div>`
    );

    if (emailResult instanceof Error) {
      // Check if sending email resulted in an error
      console.error("Error sending email:", emailResult);
      res
        .status(500)
        .json({ error: "An error occurred while sending the email" });
    } else {
      res
        .status(200)
        .json({ message: "OTP generated and sent for verification" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { code, uid } = req.query; // Get the OTP code and userId from the query parameters
    if (!code || !uid) {
      return res.status(400).json({ message: "OTP and userId are required" });
    }

    const result = await findUserAndVerifyOTPCode(uid, code);

    if (result.user) {
      // User was found and OTP was successfully verified
      res.redirect(`${process.env.DOMAIN}/profile`)
    } else if (result.message === "User is already verified") {
      // User is already verified
      res.redirect(`${process.env.DOMAIN}/profile`)
    } else {
      // Invalid OTP
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the user's profile (protected route)
const userProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the password field from the user object
    delete user._doc.password;
    // Return the user's profile data without the password
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId; // Get the userId from the request object
    const { name} = req.body;
    const data = { name };
    const result = await updateUserProfile(userId, data);
    if (!result.user) {
      return res.status(400).json({ message: result.message });
    }
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const userId = req.user.userId; // Get the userId from the request object

    const { oldPassword, newPassword } = req.body;

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const code = generateRandomCode(6);
    user.passwordResetToken = code;
    await user.save();
    const emailResult = await sendMail(
     user.email,
      "Reset Password",
      `Reset Your Password`,
      `
          <div class="container">
            <div class="card">
              <h3>Reset Your Password</h3>
              <br>
              <a href="${process.env.DOMAIN}/reset-password?code=${code}&uid=${user._id}">
                <button>Reset</button>
              </a>
            </div>
          </div>`
    );
    if (emailResult instanceof Error) {
      // Check if sending email resulted in an error
      console.error("Error sending email:", emailResult);
      res
        .status(500)
        .json({ error: "An error occurred while sending the email" });
    } else {
      res.status(200).json({ message: "OTP generated and sent" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { code, uid, newPassword } = req.body;
    if (!code || !uid) {
      return res.status(400).json({ message: "OTP and userId are required" });
    }
    if(!newPassword){
      return res.status(400).json({ message: "New password is required" });
    }

      const user = await findUserById(uid);
      if(!user){
        return res.status(400).json({ message: "User not found" });
      }
      if(user.passwordResetToken !== code){
        return res.status(400).json({ message: "Invalid code" });
      }
      if(user.passwordResetToken === code){
        user.passwordResetToken = null;
      }
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);
   user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    
     await DeleteUser(userId); // Call the helper function

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const registerSuperAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { name, email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = await createAdmin(name, email, password, "admin");
    const token = jwt.sign({ userId: newUser._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error registering superadmin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const loginSuperAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if(user.userType !== "admin"){
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in superadmin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


module.exports = {
  registerUser,
  loginUser,
  userProfile,
  sendOtp,
  verifyOtp,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  registerSuperAdmin,
  loginSuperAdmin
};
