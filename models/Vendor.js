const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  business_name: {
    type: String,
  },
  brand_logo: {
    type: String, // You can store the logo's file path or URL as a string

  },
  brand_description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
