const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/productController");
const vendorAuth = require("../middleware/vendorAuth");
const superAdminAuth = require("../middleware/superAdminAuth");
const productImage = require("../middleware/productImageUpload");

router.post("/create",vendorAuth, productImage,ProductController.createProduct);
router.post("/add-variation",productImage, vendorAuth, ProductController.addVariation);
router.post("/add-category",superAdminAuth, ProductController.addCategory);

router.get("/get-all-variations", ProductController.getAllVariations);
router.get("/get-all-categories", ProductController.getAllCategories);
router.get("/get-all", ProductController.getAllProducts);
router.get("/get/:productId", ProductController.getProductById);


router.patch("/update",productImage,vendorAuth, ProductController.updateProduct);
router.patch("/update-variation",productImage, vendorAuth, ProductController.updateVariation);
router.patch("/update-category",superAdminAuth, ProductController.updateCategory);


router.delete("/delete/:productId",vendorAuth, ProductController.deleteProduct);
router.delete("/delete-variation/:productId/:variationId",vendorAuth, ProductController.deleteVariation);
router.delete("/delete-category/:categoryId",superAdminAuth, ProductController.deleteCategory);





module.exports = router;
