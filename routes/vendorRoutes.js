const express = require("express");
const router = express.Router();
const VendorController = require("../controllers/vendorController");
const { check } = require("express-validator");
const vendorAuth = require("../middleware/vendorAuth")
const vendorLogo = require('../middleware/vendorLogoUpload');


router.post("/login",// Validation middleware using express-validator
[
check("email").isEmail().withMessage("Invalid email address"),
check("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long"),
], VendorController.loginVendor);

router.get("/profile",vendorAuth,VendorController.getVendorProfile);
router.get("/protected",vendorAuth,(req,res)=>{
  res.status(200).json({message:"User is a Vendor"})
});

router.patch("/update",vendorAuth,VendorController.updateVendorProfile);
router.patch("/update-logo",vendorAuth,vendorLogo.single('logo'), VendorController.updateVendorLogo)
router.delete("/delete",vendorAuth,VendorController.deleteVendor);

module.exports = router;