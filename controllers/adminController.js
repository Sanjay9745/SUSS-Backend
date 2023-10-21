const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  sendMail,
  generateOTP,
  generateRandomCode,
} = require("./emailController");
const path = require("path");
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
const { deleteVariationImages, unlinkUploadedFiles } = require("../helpers/productHelpers");
const Product = require("../models/Product");
const Variation = require("../models/Variation");
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

    const { name, email, password, userType ,userId} = req.body;
    const user = await findUserById(userId);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
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
  const page = parseInt(req.query.page) || 1; // Current page number, default is 1
  const perPage = parseInt(req.query.perPage) || 10; // Number of users per page, default is 10
  const search = req.query.search; // Search query

  try {
    let query = { userType: "user" };

    if (search) {
      query = { ...query, name: { $regex: search, $options: "i" } }; // Using regular expression for case-insensitive search
    }

    const users = await User.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

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

const deleteProduct = async (req, res) => {
  try {
const productId = req.body.productId; // Get the productId from the request object
console.log(productId);
    // Find the product by productId
    const product = await Product.findOne({
      _id: productId
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete all variations and their associated images
    for (const variationId of product.variations) {
      try {
        await deleteVariationImages(variationId);
        await Variation.findByIdAndDelete(variationId);
      } catch (error) {
        console.error("Error deleting variation:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }

    // Delete the product
    for (const key in product.images) {
      const imagePath = product.images[key];
      const fullPath = path.join(__dirname, "..", "uploads", imagePath);

      try {
        // Delete the image file using fs.promises.unlink
        await fs.unlink(fullPath);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const files = req.files;
    const { name, slug, description,gender, categoryId,productId } = req.body;
    const existingProduct = await Product.findOne({ _id:productId});
    if (existingProduct && existingProduct.slug !== slug) {
      const productWithSlug = await Product.findOne({ slug:slug});
      if (productWithSlug && productWithSlug._id.toString() !== productId){

        return res.status(400).json({ message: "Slug already exists" });
      }
    }

    // Create an object to store the images with numbered keys
    const imageObj = {};
    const uploadedFiles = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const key = `image${index + 1}`;

      try {
        // Extract the filename from the file path
        const filename = path.basename(file.path);
        const imagePath = "productImage/" + filename;

        // Update the product's images with the file path
        imageObj[key] = imagePath;

        uploadedFiles.push(file.path);
      } catch (error) {
        // Handle any errors that occur during file processing
        console.error("Error processing file:", error);

        // Unlink (delete) the uploaded files
        await unlinkUploadedFiles(uploadedFiles);

        // Return an error response
        return res.status(500).json({ message: "Error processing files" });
      }
    }

    const updateFields = {};

    if (name) {
      updateFields.name = name;
    }

    if (description) {
      updateFields.description = description;
    }

    if (slug) {
      updateFields.slug = slug;
    }

    if (Object.keys(imageObj).length > 0) {
      updateFields.images = imageObj;
    }

    if (categoryId) {
      updateFields.categoryId = categoryId;
    }
    if (gender) {
      updateFields.gender = gender;
    }

    const product = await Product.findOneAndUpdate(
      {_id: productId },
      updateFields,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteVariation = async (req, res) => {
  try {
    const { productId, variationId } = req.body;

    // Find the product by productId
    const product = await Product.findOne({
      _id: productId,
    });
    if (!product) return res.status(400).json({ message: "Product not found" });
    // Find the variation by variationId
    const variation = await Variation.findById(variationId);
    if (!variation)
      return res.status(400).json({ message: "Variation not found" });

    // Delete the variation
    await deleteVariationImages(variationId);
    await Variation.findByIdAndDelete(variationId);

    // Remove the variation from the product's variations array
    product.variations.pull(variationId);

    // Save the updated product
    await product.save();

    res.status(200).json({ product });
  } catch (error) {
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
  deleteProduct,
  updateProduct,
  deleteVariation
};
