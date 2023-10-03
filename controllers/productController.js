const Product = require("../models/Product");
const Variation = require("../models/Variation");
const Category = require("../models/Category");
const fs = require("fs").promises; // Import the 'fs' module for file operations
const path = require("path");
const {
  unlinkUploadedFiles,
  deleteExistingImages,
  deleteVariationImages,
  getLowestVariationPrice,
  getVariationsByProductId,
  getVendorByProductId,
  getProductsByPriceRange,
  getProductsBySize,
  getProductsByColor,
  getProductsByVendor,
  getProductsByCategory,
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
      slug: slug,
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
    const product = await Product.findOne({
      _id: productId,
      vendorId: req.vendor.vendorId,
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

const getProductFromSlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json(error.message);
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
      vendorId: vendor.vendorId,
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

    const variation = await Variation.findOne({
      _id: variationId,
      vendorId: req.vendor.vendorId,
    });

    if (!variation) {
      return res.status(404).json({ message: "Variation not found" });
    }

    // Delete existing images before updating
    if (variation.images) {
      await deleteExistingImages(variation.images);
    }

    // Update fields using ternary conditional with the current value if undefined
    variation.price = price !== undefined ? price : variation.price || "";
    variation.stock = stock !== undefined ? stock : variation.stock || "";
    variation.size = size !== undefined ? size : variation.size || "";
    variation.color = color !== undefined ? color : variation.color || "";
    variation.weight = weight !== undefined ? weight : variation.weight || "";
    variation.dimension.x =
      dimensionX !== undefined ? dimensionX : variation.dimension.x || "";
    variation.dimension.y =
      dimensionY !== undefined ? dimensionY : variation.dimension.y || "";
    variation.dimension.z =
      dimensionZ !== undefined ? dimensionZ : variation.dimension.z || "";

    variation.offer_price =
      offer_price !== undefined ? offer_price : variation.offer_price || "";
    variation.offer_start_date =
      offer_start_date !== undefined
        ? offer_start_date
        : variation.offer_start_date || "";
    variation.offer_end_date =
      offer_end_date !== undefined
        ? offer_end_date
        : variation.offer_end_date || "";
    variation.margin = margin !== undefined ? margin : variation.margin || "";

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
const getSingleProductWithFullDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findOne({ _id: id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Use the getLowestVariationPrice helper function
    const lowestPrice = await getLowestVariationPrice(id);
    const variations = await getVariationsByProductId(id);
    const vendorDetails = await getVendorByProductId(id);

    const productWithPrice = {
      ...product.toObject(),
      price: lowestPrice, // Add the "price" field
      variationsDetails: variations,
      vendorDetails: vendorDetails,
    };

    res.status(200).json(productWithPrice);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteVariation = async (req, res) => {
  try {
    const { productId, variationId } = req.params;

    // Find the product by productId
    const product = await Product.findOne({
      _id: productId,
      vendorId: req.vendor.vendorId,
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
const getProductOfVendor = async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendorId: vendor.vendorId });
    if (!products) {
      res.status(404).json({ message: "No Product found" });
    }
    res.status(200).json(products);
  } catch (error) {
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

const getAllProductWithPrice = async (req, res) => {
  try {
    // Get all products
    const products = await Product.find();
    // Create a new array of products with the "price" field
    const productsWithPrice = [];

    // Iterate through each product and add the lowest variation price
    for (const product of products) {
      const lowestPrice = await getLowestVariationPrice(product._id);

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
    res.status(500).json({ message: "Internal server error" });
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
  const { productId } = req.params;
  //get product by id
  try {
    const variations = await Variation.find({ productId: productId });
    res.json(variations);
  } catch (error) {
    res.status(500).json({ message: "error getting variations" });
  }
};
const getProductsWithPagination = async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to a limit of 10 products per page

    // Calculate the starting index for the products on the current page
    const startIndex = (page - 1) * limit;

    // Get all products
    const allProducts = await Product.find();

    // Slice the products array based on the pagination parameters
    const productsOnPage = allProducts.slice(startIndex, startIndex + limit);

    // Create an array to store products with full details
    const productsWithFullDetails = [];

    for (const product of productsOnPage) {
      const productId = product._id;

      // Use the getLowestVariationPrice helper function to get the lowest price
      const lowestPrice = await getLowestVariationPrice(productId);

      // Use the getVariationsByProductId helper function to get variations details
      const variations = await getVariationsByProductId(productId);

      // Use the getVendorByProductId helper function to get vendor details
      const vendorDetails = await getVendorByProductId(productId);

      // Create a product object with full details
      const productWithFullDetails = {
        ...product.toObject(),
        price: lowestPrice, // Add the "price" field
        variationsDetails: variations,
        vendorDetails: vendorDetails,
      };

      // Add the product to the array
      productsWithFullDetails.push(productWithFullDetails);
    }

    // Send the array of products with full details as a response
    res.status(200).json({
      totalProducts: allProducts.length,
      currentPage: page,
      totalPages: Math.ceil(allProducts.length / limit),
      products: productsWithFullDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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

const getProductByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ categoryId: categoryId });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No Product found" });
    }

    // Add the 'lowestPrice' field to each product
    for (const product of products) {
      const lowestPrice = await getLowestPriceForProduct(product._id);
      product.lowestPrice = lowestPrice;
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const products = await Product.find({ vendorId: vendorId });

    // Iterate through each product and calculate the lowest variation price
    for (const product of products) {
      product.lowestPrice = await getLowestVariationPrice(product._id);
    }

    if (!products) {
      res.status(404).json({ message: "No Product found" });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductByPriceRange = async (req, res) => {
  try {
    const { startPrice, endPrice } = req.params;

    // Check if startPrice and endPrice are valid numbers
    if (isNaN(startPrice) || isNaN(endPrice)) {
      return res.status(400).json({ message: "Invalid price range values" });
    }

    // Find all products
    const products = await Product.find();

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found within the price range" });
    }

    // Iterate through each product and calculate the lowest variation price
    const productsWithPrice = [];
    for (const product of products) {
      const variations = await Variation.find({ productId: product._id });

      // Find the variation with the lowest price
      let lowestPrice = Infinity;
      for (const variation of variations) {
        if (variation.price < lowestPrice) {
          lowestPrice = variation.price;
        }
      }

      // Add the lowest price to the product object
      const productWithPrice = {
        ...product.toObject(),
        price: lowestPrice,
      };

      // Check if the product's price is within the specified range
      if (
        lowestPrice >= parseFloat(startPrice) &&
        lowestPrice <= parseFloat(endPrice)
      ) {
        productsWithPrice.push(productWithPrice);
      }
    }

    res.status(200).json(productsWithPrice);
  } catch (error) {
    console.error("Error getting products by price range:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductBySize = async (req, res) => {
  try {
    const { size } = req.params;

    const variations = await Variation.find({ size });
    const products = [];

    // Use Promise.all to resolve all the async findOne calls
    await Promise.all(
      variations.map(async (variation) => {
        const product = await Product.findOne({ _id: variation.productId });
        if (product) {
          const productWithDetails = {
            name: product.name,
            image: product.images, // Replace with the actual field name for images
            vendorId: product.vendorId,
            categoryId: product.categoryId,
            description: product.description,
            variationDetails: variation,
            price: variation.price,
          };
          products.push(productWithDetails);
        }
      })
    );

    res.json(products);
  } catch (error) {
    console.error("Error getting products by size:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductByColor = async (req, res) => {
  try {
    const { color } = req.params;

    const variations = await Variation.find({ color });
    const products = [];

    // Use Promise.all to resolve all the async findOne calls
    await Promise.all(
      variations.map(async (variation) => {
        const product = await Product.findOne({ _id: variation.productId });
        if (product) {
          const productWithDetails = {
            name: product.name,
            image: product.images, // Replace with the actual field name for images
            vendorId: product.vendorId,
            categoryId: product.categoryId,
            description: product.description,
            color: variation.color,
            variationDetails: variation,
            price: variation.price,
          };
          products.push(productWithDetails);
        }
      })
    );

    res.json(products);
  } catch (error) {
    console.error("Error getting products by size and color:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Main filter function
const filterProducts = async (req, res) => {
  try {
    const { startPrice, endPrice, size, color, vendor, category, limit, page } =
      req.query;

    let products = [];

    // Apply filters based on provided parameters
    if (startPrice && endPrice) {
      products = await getProductsByPriceRange(startPrice, endPrice);
    } else if (size) {
      products = await getProductsBySize(size);
    } else if (color) {
      products = await getProductsByColor(color);
    } else if (vendor) {
      products = await getProductsByVendor(vendor);
    } else if (category) {
      products = await getProductsByCategory(category);
    } else {
      // If no filters are provided, return all products
      products = await Product.find();
    }

    // Sort products if needed
    if (startPrice || endPrice) {
      products.sort(
        (a, b) => a.variationDetails.price - b.variationDetails.price
      );
    }
    products = products.filter((product) => {
      // Check startPrice and endPrice
      if (
        (startPrice && product.variationDetails.price < startPrice) ||
        (endPrice && product.variationDetails.price > endPrice)
      ) {
        return false;
      }

      // Check size
      if (size && product.variationDetails.size !== size) {
        return false;
      }

      // Check color
      if (color && product.variationDetails.color !== color) {
        return false;
      }

      // Check vendor
      if (vendor && product.vendorId !== vendor) {
        return false;
      }

      // Check category
      if (category && product.categoryId !== category) {
        return false;
      }

      // If all conditions pass, keep the product
      return true;
    });
    // Paginate if needed
    if (limit && page) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      return res.status(200).json(paginatedProducts);
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//this is long filtering time complex is 0(n)
const filter = async (req, res) => {
  try {
    const { startPrice, endPrice, size, color, vendor, category, limit, page,productId } =
      req.query;
    const productsWithVariations = [];

    // Use await to ensure products are fetched before proceeding
    const products = await Product.find();

    for (const product of products) {
      if (product.variations && product.variations.length > 0) {
        for (const variationId of product.variations) {
          const variation = await Variation.findById(variationId);

          // Create a productVariation object with default values
          const productVariation = {
            _id: product._id,
            name: product.name,
            description: product.description,
            images: product.images || {},
            price: null,
            offer_price: null,
            size: null,
            color: null,
            vendorId: product.vendorId,
            category: product.categoryId,
          };

          if (variation) {
            // If variation exists, update the productVariation properties
            productVariation.variationImages = variation.images || "";
            productVariation.price = variation.price || null;
            productVariation.offer_price = variation.offer_price || null;
            productVariation.size = variation.size || "";
            productVariation.color = variation.color || "";
          }

          // Push the productVariation to the array
          productsWithVariations.push(productVariation);
        }
      } else {
        // If there are no variations, add the product itself
        const productWithoutVariation = {
          _id: product._id,
          name: product.name,
          description: product.description,
          images: product.images || {},
          price: null,
          offer_price: null,
          size: null,
          color: null,
          vendorId: product.vendorId,
          category: product.categoryId,
          variationImages: "", // Default value for variationImages when no variation
        };

        // Push the productWithoutVariation to the array
        productsWithVariations.push(productWithoutVariation);
      }
    }

    // Initialize filteredProducts with all productsWithVariations
    let filteredProducts = [...productsWithVariations];

    if (startPrice && endPrice) {
      filteredProducts = filteredProducts.filter((product) =>
        product.price >= startPrice && product.price <= endPrice
      );
    }
    if (size) {
      filteredProducts = filteredProducts.filter(
        (product) => product.size === size
      );
    }
    if (color) {
      filteredProducts = filteredProducts.filter(
        (product) => product.color === color
      );
    }
    if (vendor) {
      filteredProducts = filteredProducts.filter(
        (product) => product.vendorId === vendor
      );
    }
    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === category
      );
    }

    if(productId){
      filteredProducts = filteredProducts.filter(
        (product) => product._id.toString() === productId
      );
    }
 
    if (limit && page) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      return res.status(200).json(paginatedProducts);
    } else {
      return res.status(200).json(filteredProducts);
    }
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
  getSingleProductWithFullDetails,
  getProductsWithPagination,
  filter,
};
