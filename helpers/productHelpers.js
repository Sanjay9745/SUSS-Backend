const fs = require("fs").promises; // Import the 'fs' module for file operations
const path = require("path");
const Variation = require("../models/Variation");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
// Helper function to unlink (delete) uploaded files
async function unlinkUploadedFiles(filePaths) {
  try {
    for (const filePath of filePaths) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error("Error unlinking files:", error);
  }
}
// Helper function to delete existing images
async function deleteExistingImages(imagePaths) {
  try {
    for (const imagePath of imagePaths) {
      const fullPath = path.join(__dirname, "..", imagePath); // Construct the full path
      await fs.unlink(fullPath); // Delete the image file
    }
  } catch (error) {
    console.error("Error deleting existing images:", error);
  }
}
const deleteVariationImages = async (variationId) => {
  try {
    const variation = await Variation.findById(variationId);
    if (!variation) {
      return; // Variation not found, no images to delete
    }

    const images = variation.images;
    for (const key in images) {
      const imagePath = images[key];
      const fullPath = path.join(__dirname, "..", "uploads", imagePath);

      try {
        // Delete the image file using fs.promises.unlink
        await fs.unlink(fullPath);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  } catch (error) {
    console.error("Error finding variation:", error);
  }
};
const getLowestVariationPrice = async (productId) => {
  try {
    // Find all variations for the given product
    const variations = await Variation.find({ productId });

    if (!variations || variations.length === 0) {
      // If no variations are found, return null or a default value as needed
      return null;
    }

    // Find the variation with the lowest price
    let lowestPrice = Infinity;
    for (const variation of variations) {
      if (variation.price < lowestPrice) {
        lowestPrice = variation.price;
      }
    }

    return lowestPrice;
  } catch (error) {
    console.error("Error fetching lowest variation price:", error);
    return null; // Handle the error by returning null or a default value
  }
};

const getVariationsByProductId = async (productId) => {
  try {
    // Find all variations for the given product ID
    const variations = await Variation.find({ productId });

    return variations;
  } catch (error) {
    console.error("Error fetching variations by product ID:", error);
    return []; // Handle the error by returning an empty array or an appropriate default value
  }
};
const getVendorByProductId = async (productId) => {
  try {
    // Find the product by its ID to get the vendorId
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      throw new Error("Product not found");
    }

    // Find the vendor using the vendorId from the product
    const vendor = await Vendor.findOne({ _id: product.vendorId });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return vendor;
  } catch (error) {
    console.error("Error getting vendor by product ID:", error);
    return null; // Handle the error by returning null or an appropriate default value
  }
};

// Helper function to get products by category
const getProductsByCategory = async (categoryId) => {
  try {
    // Find products by categoryId
    const products = await Product.find({ categoryId });

    // Add the 'price' field to each product
    for (const product of products) {
      const lowestPrice = await getLowestVariationPrice(product._id);
      product.price = lowestPrice;
    }

    return products;
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
};

const getProductsByVendor = async (vendorId) => {
  try {
    // Find products by vendorId
    const products = await Product.find({ vendorId });

    // Add t

    return products;
  } catch (error) {
    console.error("Error fetching products by vendor:", error);
    return [];
  }
};

// Helper function to get products by price range
const getProductsByPriceRange = async (startPrice, endPrice) => {
  if (isNaN(startPrice) || isNaN(endPrice)) {
    throw new Error("Invalid price range values");
  }

  const products = await Product.find();

  return products.filter(async (product) => {
    const variations = await Variation.find({ productId: product._id });
    const lowestPrice = Math.min(...variations.map((v) => v.price));
    return lowestPrice >= parseFloat(startPrice) && lowestPrice <= parseFloat(endPrice);
  });
};

// Helper function to get products by size
const getProductsBySize = async (size) => {
  const variations = await Variation.find({ size });
  const products = [];

  for (const variation of variations) {
    const product = await Product.findOne({ _id: variation.productId });
    if (product) {
      const productWithDetails = {
        name: product.name,
        image: product.images, // Replace with the actual field name for images
        vendorId: product.vendorId,
        categoryId: product.categoryId,
        description: product.description,
        variationDetails: variation,
      };
      products.push(productWithDetails);
    }
  }

  return products;
};

// Helper function to get products by color
const getProductsByColor = async (color) => {
  const variations = await Variation.find({ color });
  const products = [];

  for (const variation of variations) {
    const product = await Product.findOne({ _id: variation.productId });
    if (product) {
      const productWithDetails = {
        name: product.name,
        image:variation.images|| product.images , // Replace with the actual field name for images
        vendorId: product.vendorId,
        categoryId: product.categoryId,
        description: product.description,
        color: variation.color,
        variationDetails: variation,
      };
      products.push(productWithDetails);
    }
  }

  return products;
};
module.exports = {
  unlinkUploadedFiles,
  deleteExistingImages,
  deleteVariationImages,
  getLowestVariationPrice,
  getVariationsByProductId,
  getVendorByProductId,
  getProductsByCategory,
  getProductsByVendor,
  getProductsByPriceRange,
  getProductsBySize,
  getProductsByColor,
  

};
