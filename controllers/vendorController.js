const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require('path'); // To work with file paths
const fs = require('fs'); // To delete files
const {
  createVendor,
  findUserById,
  findVendorByEmail,
  findVendorById,
  findUserByEmail,
  findVendorByUserId,
  DeleteVendor,
} = require("../helpers/vendorHelper"); // Import userHelper
const jwtSecretKey = process.env.VENDOR_JWT_SECRET_KEY;

const loginVendor = async (req, res) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Vendor does not exist" });
    }

    if (user.userType !== "vendor") {
      return res.status(400).json({ message: "This user is not a vendor" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    let vendor = await findVendorByUserId(user._id);

    if (!vendor) {
      // Create a vendor if it doesn't exist
      const newVendor = await createVendor(user._id);

      // Generate a token for the new vendor
      const token = jwt.sign({ vendorId: newVendor._id }, jwtSecretKey, {
        expiresIn: "5d", // 5 days
      });

      return res.status(200).json({ token });
    }

    // Generate a token for the existing vendor
    const token = jwt.sign({ vendorId: vendor._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error during vendor login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getVendorProfile = async (req, res) => {
  try {
    // Fetch the vendor profile by their vendorId
    const vendor = await findVendorById(req.vendor.vendorId);

    // Check if the vendor exists
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Remove the 'password' field from the vendor object
    delete vendor.password;

    // Send the vendor profile as a response
    res.status(200).json({ vendor });
  } catch (error) {
    console.error("Error during get vendor profile:", error);

    // Handle errors gracefully and return an internal server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateVendorProfile = async (req, res) => {
  const { business_name, brand_description } = req.body;

  try {
    if (!business_name || !brand_description) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    console.log(business_name, brand_description );
    const vendor = await findVendorById(req.vendor.vendorId);
    vendor.business_name = business_name;
    vendor.brand_description = brand_description;
    await vendor.save();
    res.status(200).json({ vendor });
  } catch (error) {
    console.error("Error during update vendor profile:", error);
    // Handle errors gracefully and return an internal server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateVendorLogo = async (req, res) => {
  const { file } = req; // This 'file' property contains the uploaded image

  try {
    if (!file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Get the vendor by ID
    const vendor = await findVendorById(req.vendor.vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if(vendor.brand_logo){
   
      const filePath = path.join(__dirname, '../uploads/vendorLogo', vendor.brand_logo);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error during delete vendor logo:", err);
        }
      });
    }
    // Extract the filename from the file path
    let filename = path.basename(file.path);
    const logoPath = 'vendorLogo/' + filename;

    // Update the vendor's logo property with the concatenated path
    vendor.brand_logo = logoPath;
    // Update the vendor's logo property with the filename
    vendor.brand_logo = filename;

    // Save the updated vendor
    await vendor.save();

    res.status(200).json({ vendor });
  } catch (error) {
    console.error("Error during update vendor profile:", error);

    // Handle errors gracefully and return an internal server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const deleteVendor = async (req, res) => {
  try {
    // Fetch the vendor profile by their vendorId
    await DeleteVendor(req.vendor.vendorId);

    // Send the vendor profile as a response
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error during delete vendor:", error);

    // Handle errors gracefully and return an internal server error response
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  loginVendor,
  getVendorProfile,
  deleteVendor,
  updateVendorProfile,
  updateVendorLogo,
};
