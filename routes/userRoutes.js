const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { check } = require("express-validator");
const auth = require("../middleware/userAuth");
// Route for user registration
router.post(
  "/register",
  [
    // Validation middleware using express-validator
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Invalid email address"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  UserController.registerUser
);

// Route for user login
router.post(
  "/login",
  [
    // Validation middleware using express-validator
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  UserController.loginUser
);

//Router for send otp
router.get("/send-otp", auth, UserController.sendOtp);

//Router for verify otp
router.get("/verify-otp", UserController.verifyOtp);
// Example protected route (requires authentication middleware)
router.get("/protected", auth, (req, res) => {
  res.status(200).json({ message: "Protected route" });
});

router.get("/profile", auth, UserController.userProfile);
router.patch("/update-profile", auth, UserController.updateProfile);
router.patch(
  "/update-password",
  check("newPassword ")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  auth,
  UserController.updatePassword
);
router.post("/forgot-password", UserController.forgotPassword);
router.post(
  "/reset-password",
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  UserController.resetPassword
);
router.delete("/delete-account", auth, UserController.deleteAccount);

router.get("/cart", auth, UserController.getCart);
router.post("/add-to-cart", auth, UserController.addToCart);
router.post("/remove-cart-item", auth, UserController.removeCartItem);
router.post("/update-cart-item", auth, UserController.updateCartItem);
router.post("/clear-cart", auth, UserController.emptyCart);

router.post("/shipping-address",auth,UserController.addShippingAddress)

router.post('/update-shipping-address',auth, UserController.updateShippingAddress);
router.get("/shipping-address",auth,UserController.getShippingAddress);
router.delete("/shipping-address/:id",auth,UserController.deleteShippingAddress);

// Define the billing address routes
router.post("/billing-address", auth, UserController.addBillingAddress);
router.post("/update-billing-address", auth, UserController.updateBillingAddress);
router.get("/billing-address", auth, UserController.getBillingAddress);
router.delete("/billing-address/:id", auth, UserController.deleteBillingAddress);

router.post("/watchlist", auth, UserController.addToWatchlist);
router.post("/remove-watchlist", auth, UserController.deleteFromWatchlist);
router.get("/watchlist", auth, UserController.getWatchlist);
module.exports = router;
