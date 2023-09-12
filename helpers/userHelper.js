const User = require('../models/User'); // Import your User model
const bcrypt = require('bcryptjs');

// Create a new user in the database
async function createUser(name, email, password, userType) {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user object
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      userType
    });

    // Save the user to the database
    await newUser.save();

    return newUser;
  } catch (error) {
    throw error;
  }
}

// Find a user by email in the database
async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw error;
  }
}

// Find a user by ID in the database
async function findUserById(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw error;
  }
}
async function findUserAndAddOTPCode(userId, code) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { user: null, message: 'User not found' };
    }
    if (user.isVerified) {
      return { user: null, message: 'User is already verified' };
    }
    user.verificationToken = code;
    await user.save();
    return { user, message: 'OTP code added successfully' };
  } catch (error) {
    throw error;
  }
}

async function findUserAndVerifyOTPCode(userId, code) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { user: null, message: 'User not found' };
    }

    if (user.isVerified) {
      return { user: null, message: 'User is already verified' };
    }

    if (user.verificationToken === code) {
      user.isVerified = true;
      user.verificationToken = null;
      await user.save();
      return { user, message: 'OTP code verified successfully' };
    } else {
      return { user: null, message: 'Invalid OTP code' };
    }
  } catch (error) {
    throw error;
  }
}

const updateUserProfile = async (userId, data) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { user: null, message: 'User not found' };
    }
    user.name = data.name;
    await user.save();
    return { user, message: 'User updated successfully' };
  } catch (error) {
    throw error;
  }
}
const DeleteUser = async (userId) => {
  try {
    await User.findOneAndDelete({_id:userId});
   
    return { message: 'User Deleted successfully' };
  } catch (error) {
    throw error;
  }
}
module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserAndAddOTPCode,
  findUserAndVerifyOTPCode,
  updateUserProfile,
  DeleteUser
};
