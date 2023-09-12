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
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const jwtSecretKey = process.env.ADMIN_JWT_SECRET_KEY;

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
    const newUser = await createUser(name, email, password, "admin");
    const token = jwt.sign({ userId: newUser._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error registering superadmin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
    if (user.userType !== "admin") {
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
};

// Register a new user
const addUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, userType } = req.body;

    // Check if the user already exists in the database
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user and save to the database using the helper function
    const newUser = await createUser(name, email, password, userType);

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

// Get the user's profile (protected route)
const singleUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Get the userId from the request object

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

const updateUser= async (req, res) => {
  try {
    const userId = req.body.userId; // Get the userId from the request object
    const { name, email, password, userType } = req.body;

    const user = await findUserById(userId);
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (userType) user.userType = userType;
    await user.save();

    res.status(200).json({ message: "User profile updated successfully"});
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = req.body.userId; // Get the userId from the request object

    await DeleteUser(userId); // Call the helper function

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: "user" });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const users = await User.find({ userType: "vendor" });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting all vendors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const singleVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId; // Get the userId from the request object
    const vendor = Vendor.findById(vendorId);
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error getting single vendor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {
  registerSuperAdmin,
  loginSuperAdmin,
  addUser,
  singleUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllVendors,
  singleVendor,
};
