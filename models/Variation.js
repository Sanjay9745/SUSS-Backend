const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
  price: {
    type: Number,
    default:null,
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
  weight: {
    type: Number,
  },
  dimension: {
    x: {
      type: String,
    },
    y: {
      type: String,
    },
    z: {
      type: String,
    },
  },
  offer_price: {
    type: Number,
    default:null
  },
  offer_start_date: {
    type: Date,
    default:null
  },
  offer_end_date: {
    type: Date,
    default:null
  },
  margin: {
    type: String,
  },
});

const Variation = mongoose.model("Variation", variationSchema);

module.exports = Variation;
