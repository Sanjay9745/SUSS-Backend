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
router.get("/profile", auth, UserController.userProfile);

module.exports = router;
