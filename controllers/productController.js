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
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image" });
    }

    const vendor = req.vendor;
    const { name, slug, description, categoryId } = req.body;

    if (!name || !description || !categoryId || !slug) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    const isSlugExist = await Product.findOne({ slug: slug });
    if (isSlugExist) {
      return res.status(400).json({ message: "Slug already exist" });
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

    const product = new Product({
      name,
      description,
      vendorId: vendor.vendorId,
      categoryId,
      images: imageObj,
      slug:slug
    });

    await product.save();

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image" });
    }

    const vendor = req.vendor;
    const { name, slug, description, categoryId } = req.body;
    const existingProduct = await Product.findOne({ slug: slug });
    if (existingProduct && existingProduct.slug !== slug) {
      
      return res.status(400).json({ message: "Slug already exists" });
      
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

    const product = await Product.findOneAndUpdate(
      { vendorId: vendor.vendorId, _id: req.params.id },
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

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find the product by productId
    const product = await Product.findOne({_id:productId,vendorId:req.vendor.vendorId})
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

const getProductFromSlug = async (req,res) =>{
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json(error.message);
  }
}

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

    const {
      productId,
      price,
      stock,
      size,
      color,
      weight,
      dimensionX,
      dimensionY,
      dimensionZ,
      offer_price,
      offer_start_date,
      offer_end_date,
      margin,
    } = req.body;

    if (!productId || !price || !stock) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const product = await Product.findOne({
      vendorId: vendor.vendorId,
      _id: productId,
    });

    if (!product) {
      return res.status(400).json({ message: "Product not found" });
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

        // Update the product's variation images with the file path
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

    const variation = new Variation({
      productId,
      price,
      stock,
      size,
      color,
      images: imageObj, // Assign the image object
      weight,
      dimension: {
        x: dimensionX,
        y: dimensionY,
        z: dimensionZ,
      },
      offer_price,
      offer_start_date,
      offer_end_date,
      margin,
      vendorId:vendor.vendorId
    });

    await variation.save();
    product.variations.push(variation._id);
    await product.save();
    res.status(201).json({ product, variation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateVariation = async (req, res) => {
  const files = req.files;
  try {
    const {
      price,
      stock,
      size,
      color,
      variationId,
      weight,
      dimensionX,
      dimensionY,
      dimensionZ,
      offer_price,
      offer_start_date,
      offer_end_date,
      margin,
    } = req.body;

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

    const variation = await Variation.findOne({ _id: variationId,vendorId:req.vendor.vendorId });

    if (!variation) {
      return res.status(404).json({ message: "Variation not found" });
    }

    // Delete existing images before updating
    if (variation.images) {
      await deleteExistingImages(variation.images);
    }

// Update fields using ternary conditional with the current value if undefined
variation.price = price !== undefined ? price : (variation.price || "");
variation.stock = stock !== undefined ? stock : (variation.stock || "");
variation.size = size !== undefined ? size : (variation.size || "");
variation.color = color !== undefined ? color : (variation.color || "");
variation.weight = weight !== undefined ? weight : (variation.weight || "");
variation.dimension.x =
  dimensionX !== undefined ? dimensionX : (variation.dimension.x || "");
variation.dimension.y =
  dimensionY !== undefined ? dimensionY : (variation.dimension.y || "");
variation.dimension.z =
  dimensionZ !== undefined ? dimensionZ : (variation.dimension.z || "");

variation.offer_price =
  offer_price !== undefined ? offer_price : (variation.offer_price || "");
variation.offer_start_date =
  offer_start_date !== undefined ? offer_start_date : (variation.offer_start_date || "");
variation.offer_end_date =
  offer_end_date !== undefined ? offer_end_date : (variation.offer_end_date || "");
variation.margin = margin !== undefined ? margin : (variation.margin || "");

   // Create a new 'images' field with the updated image paths if imageObj is not empty
if (Object.keys(imageObj).length > 0) {
  variation.images = imageObj;
}


    await variation.save();
    res.status(200).json({ variation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteVariation = async (req, res) => {
  try {
    const { productId, variationId } = req.params;
  
    // Find the product by productId
    const product = await Product.findOne({_id:productId,vendorId:req.vendor.vendorId})
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
const getProductOfVendor = async(req,res)=>{
  try {
    const vendor = req.vendor;
    const products = await Product.find({vendorId:vendor.vendorId});
    if(!products){
      res.status(404).json({message:"No Product found"});

    }
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
const getAllProducts = async (req, res) => {
  //get products
  try {
    const products = await Product.find({});
    res.status(200).send(products);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const getAllProductWithPrice = async (req, res) => {
  try {
    // Get all products
    const products = await Product.find();

    // Create a new array of products with the "price" field
    const productsWithPrice = [];

    // Iterate through each product and add the lowest variation price
    for (const product of products) {
      const variations = await Variation.find({ productId: product._id });

      // Find the variation with the lowest price
      let lowestPrice = Infinity;
      for (const variation of variations) {
        if (variation.price < lowestPrice) {
          lowestPrice = variation.price;
        }
      }

      // Add the lowest price to the product
      const productWithPrice = {
        ...product.toObject(),
        price: lowestPrice, // Add the "price" field
      };

      // Add the product to the new array
      productsWithPrice.push(productWithPrice);
    }

    // Send the new array of products with lowest prices as a response
    res.json(productsWithPrice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
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
const getProductWithVariation = async (req, res) => {
  const {productId} = req.params;
  //get product by id
  try {

    const variations = await Variation.find({productId:productId});
res.json(variations)
  } catch (error) {
    res.status(500).json({message:"error getting variations"})
  }
}

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

const getProductByCategory = async (req,res)=>{
  try {
    const {categoryId} = req.params;
    const products = await Product.find({categoryId:categoryId});
    if(!products){
      res.status(404).json({message:"No Product found"});

    }
    res.status(200).json(products)

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
}

const getProductByVendor = async (req,res)=>{
  try {
    const {vendorId} = req.params;
    const products = await Product.find({vendorId:vendorId});
    if(!products){
      res.status(404).json({message:"No Product found"});
    }
    res.status(200).json(products)
  }catch(error){
    res.status(500).json({ message: "Internal Server Error" })
  }
}

const getProductByPriceRange = async (req, res) => {
  try {
    const { startPrice, endPrice } = req.params;

    // Check if startPrice and endPrice are valid numbers
    if (isNaN(startPrice) || isNaN(endPrice)) {
      return res.status(400).json({ message: "Invalid price range values" });
    }

    // Find products with variations within the specified price range
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variations", // The name of the Variation collection
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $unwind: "$variations",
      },
      {
        $match: {
          "variations.price": {
            $gte: parseFloat(startPrice),
            $lte: parseFloat(endPrice),
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          // Add other fields from the Product model as needed
        },
      },
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found within the price range" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error getting products by price range:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductBySize = async (req, res) => {
  try {
    const { size } = req.params;

    // Find products with variations within the specified size
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variations", // The name of the Variation collection
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $unwind: "$variations",
      },
      {
        $match: {
          "variations.size": size,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          // Add other fields from the Product model as needed
        },
      },
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found within the size" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error getting products by size:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const getProductByColor = async (req, res) => {
  try {
    const { color } = req.params;
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variations", // The name of the Variation collection
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $unwind: "$variations",
      },
      {
        $match: {
          "variations.color": color,
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          // Add other fields from the Product model as needed
        },
      },
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found within the size" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error getting products by size:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const filterProducts = async (req, res) => {
  try {
    const { category, vendor, startPrice, endPrice, size, color } = req.query;
    let filter = {};

    // Apply filters based on provided parameters
    if (category) {
      filter.categoryId = category;
    }
    if (vendor) {
      filter.vendorId = vendor;
    }
    if (startPrice !== undefined && endPrice !== undefined) {
      filter = {
        ...filter,
        $expr: {
          $gte: ['$variations.price', parseFloat(startPrice)],
          $lte: ['$variations.price', parseFloat(endPrice)],
        },
      };
    }
    if (size) {
      filter['variations.size'] = size;
    }
    if (color) {
      filter['variations.color'] = color;
    }

    // Aggregate products based on the applied filters
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variations", // The name of the Variation collection
          localField: "_id",
          foreignField: "productId",
          as: "variations",
        },
      },
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          // Add other fields from the Product model as needed
        },
      },
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found matching the criteria" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
  getProductOfVendor,
  getProductFromSlug,
  getAllProducts,
  getProductById,
  addCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
  getProductWithVariation,
  getAllProductWithPrice,
  getProductByCategory,
  getProductByVendor,
  getProductByPriceRange,
  getProductBySize,
  getProductByColor,
  filterProducts,

};
