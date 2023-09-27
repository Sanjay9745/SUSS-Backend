const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { check } = require("express-validator");
const auth = require("../middleware/superAdminAuth");
// Route for superadmin registration

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
  AdminController.registerSuperAdmin
);

// Route for superadmin login
router.post(
  "/login",
  [
    // Validation middleware using express-validator
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  AdminController.loginSuperAdmin
);

// Example protected route (requires authentication middleware)
router.get("/protected", auth, (req, res) => {
    res.status(200).json({ message: "Protected route" });
    }
);

router.get('/get-all-users', auth, AdminController.getAllUsers)
router.post('/add-user', auth, AdminController.addUser)
router.post('/update-user', auth, AdminController.updateUser)
router.post('/delete-user', auth, AdminController.deleteUser)
router.get('/single-user/:userId', auth, AdminController.singleUser)
router.get('/get-all-vendors', auth, AdminController.getAllVendors);
router.get('/single-vendor/:vendorId', auth, AdminController.singleVendor);

module.exports = router;