const Product = require("../models/Product");
const Variation = require("../models/Variation");
const Category = require("../models/Category");
const fs = require("fs").promises; // Import the 'fs' module for file operations
const path = require("path");
const {
  unlinkUploadedFiles,
  deleteExistingImages,
  deleteVariationImages,
} = require("../helpers/productHelpers");

const createProduct = async (req, res) => {
  //create product
  try {
    const vendor = req.vendor;
    const { name, description, categoryId } = req.body;
    if (!name || !description || !categoryId)
      return res.status(400).send("Please enter all fields");

    const product = new Product({
      name,
      description,
      vendorId: vendor.vendorId,
      categoryId,
    });
    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllVariations = async (req, res) => {
  //get variations
  try {
    const variations = await Variation.find({});
    res.status(200).send(variations);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const addVariation = async (req, res) => {
  const files = req.files;
  try {
    const vendor = req.vendor;
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image" });
    }
    const { productId, price, stock, size, color } = req.body;

    if (!productId || !price || !stock)
      return res.status(400).send("Please enter all fields");

    const product = await Product.findOne({
      vendorId: vendor.vendorId,
      _id: productId,
    });

    if (!product) return res.status(400).send("Product not found");

    // Create an object to store the images with numbered keys
    const imageObj = {};
    const uploadedFiles = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const key = `image${index + 1}`;

      try {
        // Extract the filename from the file path
        const filename = path.basename(file.path);
        const logoPath = "productImage/" + filename;

        // Update the vendor's logo property with the concatenated path
        vendor.brand_logo = logoPath;

        // Update the product's variation images with the file path
        imageObj[key] = logoPath;

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

    const variation = new Variation({
      productId,
      price,
      stock,
      size,
      color,
      images: imageObj, // Assign the image object
    });

    await variation.save();
    product.variations.push(variation._id);
    await product.save();
    res.status(201).json({ product, variation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateVariation = async (req, res) => {
  const files = req.files;
  try {
    const { price, stock, size, color, variationId } = req.body;

    const imageObj = {};
    const uploadedFiles = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const key = `image${index + 1}`;

      try {
        // Extract the filename from the file path
        const filename = path.basename(file.path);
        const imagePath = "productImage/" + filename; // Remove the "uploads/" prefix

        // Update the variation's image property with the concatenated path
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

    const variation = await Variation.findOne({ _id: variationId });

    if (!variation) {
      return res.status(400).send("Variation not found");
    }

    // Delete existing images before updating
    if (variation.images) {
      await deleteExistingImages(variation.images);
    }

    // Update fields using ternary conditional (one-liner)
    price !== null && (variation.price = price);
    stock !== null && (variation.stock = stock);
    size !== null && (variation.size = size);
    color !== null && (variation.color = color);

    // Create a new 'images' field with the updated image paths
    variation.images = imageObj;

    await variation.save();
    res.status(201).json({ variation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteVariation = async (req, res) => {
  try {
    const { productId, variationId } = req.params;

    // Find the product by productId
    const product = await Product.findById(productId);
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

const updateProduct = async (req, res) => {
  //update product
  try {
    const vendor = req.vendor;
    const { name, description } = req.body;
    if (!name || !description)
      return res.status(400).send("Please enter all fields");

    const product = await Product.findOneAndUpdate(
      { vendorId: vendor.vendorId, productId: req.params.id },
      {
        name,
        description,
      }
    );
    if (!product) return res.status(400).send("Product not found");

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find the product by productId
    const product = await Product.findById(productId);
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
    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProducts = async (req, res) => {
  //get products
  try {
    const products = await Product.find({});
    res.status(200).send(products);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const getProductById = async (req, res) => {
  //get product by id
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    res.status(200).send(product);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send("Please enter all fields");
    const category = new Category({
      name,
    });
    await category.save();
    res.status(201).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  //get products
  try {
    const categories = await Category.find({});
    res.status(200).send(categories);
  } catch (error) {
    res.status(400).send(error.message);
  }
};
const deleteCategory = async (req, res) => {
  //delete product
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.categoryId,
    });
    if (!category) return res.status(400).send("Category not found");
    res.status(201).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  //update product
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send("Please enter all fields");
    const category = await Category.findOneAndUpdate(
      { _id: req.params.categoryId },
      {
        name,
      }
    );
    if (!category) return res.status(400).send("Category not found");
    res.status(201).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllVariations,
  addVariation,
  updateVariation,
  deleteVariation,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  addCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
};
