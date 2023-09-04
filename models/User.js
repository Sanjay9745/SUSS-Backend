const mongoose = require('mongoose');

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
});

const User = mongoose.model('User', userSchema);

module.exports = User;
