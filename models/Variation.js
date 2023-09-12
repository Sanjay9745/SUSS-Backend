const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  size: {
    type: String,
  },
  color: {
    type: String,
  },
  images: {
    type: Object,
  },
});

const Variation = mongoose.model("Variation", variationSchema);

module.exports = Variation;
