const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false, // Set to false by default until email is verified
  },
  verificationToken: {
    type: String, // Store a token for email verification
  },
  passwordResetToken: {
    type: String, // Store a token for password reset
  },
  passwordResetTokenExpiresAt: {
    type: Date, // Store the expiry time of the token
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userType: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "user", // Set a default value if needed
  },
  cart: [
    {
      productId: { type: String },
      variationId: { type: String },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
