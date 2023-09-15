const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug:{
    type:String,
  },
  vendorId: { type: String },
  categoryId: { type: String },
  variations: { type: Array },
  description: { type: String },
  images: {
    type: Object,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
