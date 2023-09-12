const User = require("../models/User"); // Import your User model
const Vendor = require("../models/Vendor"); // Import your vendor model
const bcrypt = require("bcryptjs");

// Create a new user in the database
async function createVendor(userId) {
  try {
    // Check if a vendor with the same email already exists
    const existingVendor = await Vendor.findOne({userId });
    if (existingVendor) {
      throw new Error("Vendor already exists");
    }

    // Create a new vendor object
    const newVendor = new Vendor({
      userId,
    });

    // Save the new vendor to the database
    await newVendor.save();

    return newVendor;
  } catch (error) {
    throw error;
  }
};

// Find a user by ID in the database
async function findUserById(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw error;
  }
}
async function findVendorByUserId(userId) {
  try {
    const vendor = await Vendor.findOne({userId});
    return vendor;
  } catch (error) {
    throw error;
  }
}
async function findVendorById(vendorId) {
  try {
    const vendor = await Vendor.findById(vendorId);
    return vendor;
  } catch (error) {
    throw error;
  }
}

async function findVendorByEmail(email) {
  try {
    const vendor = await Vendor.findOne({ email });
    return vendor;
  } catch (error) {
    throw error;
  }
}

async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw error;
  }
}

const DeleteVendor = async (vendorId) => {
  try {
    await Vendor.findOneAndDelete({ _id: vendorId });
    return { message: "Vendor Deleted successfully" };
  } catch (error) {
    throw error;
  }
};
module.exports = {
  createVendor,
  findUserById,
  findVendorById,
  findUserByEmail,
  findVendorByUserId,
  findVendorByEmail,
  DeleteVendor,
};
