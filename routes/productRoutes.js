const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/productController");
const vendorAuth = require("../middleware/vendorAuth");
const superAdminAuth = require("../middleware/superAdminAuth");
const productImage = require("../middleware/productImageUpload");

//with full details
router.get("/single/:id", ProductController.getSingleProductWithFullDetails);
router.get(
  "/products-with-pagination",
  ProductController.getProductsWithPagination
);

router.get("/get-all-variations", ProductController.getAllVariations);
router.get("/get-all-categories", ProductController.getAllCategories);

router.get("/get-all", ProductController.getAllProducts);
router.get("/products-with-price", ProductController.getAllProductWithPrice);

router.get("/get/:productId", ProductController.getProductById);

router.get("/get-product-from-slug", ProductController.getProductFromSlug);
router.get("/get-variation/:variationId", ProductController.getVariationById);
router.get(
  "/get-product-with-variation/:productId",
  ProductController.getProductWithVariation
);
router.get(
  "/get-products-of-vendor",
  vendorAuth,
  ProductController.getProductOfVendor
);
router.get(
  "/get-product-by-category/:categoryId",
  ProductController.getProductByCategory
);
router.get(
  "/get-product-by-vendor/:vendorId",
  ProductController.getProductByVendor
);
//get by price range
router.get(
  "/get-by-price-range/:startPrice/:endPrice",
  ProductController.getProductByPriceRange
);
//get product by size
router.get("/get-by-size/:size", ProductController.getProductBySize);
//get by color
router.get("/get-by-color/:color", ProductController.getProductByColor);
//get filtered product
router.get("/filtered-products", ProductController.filterProducts);
router.get("/filters", ProductController.filter);

router.post(
  "/create",
  vendorAuth,
  productImage,
  ProductController.createProduct
);
router.post(
  "/add-variation",
  productImage,
  vendorAuth,
  ProductController.addVariation
);
router.post("/add-category", superAdminAuth, ProductController.addCategory);

router.patch(
  "/update/:id",
  productImage,
  vendorAuth,
  ProductController.updateProduct
);
router.patch(
  "/update-variation",
  productImage,
  vendorAuth,
  ProductController.updateVariation
);
router.patch(
  "/update-category/:categoryId",
  superAdminAuth,
  ProductController.updateCategory
);

router.delete(
  "/delete/:productId",
  vendorAuth,
  ProductController.deleteProduct
);
router.delete(
  "/delete-variation/:productId/:variationId",
  vendorAuth,
  ProductController.deleteVariation
);
router.delete(
  "/delete-category/:categoryId",
  superAdminAuth,
  ProductController.deleteCategory
);

module.exports = router;
