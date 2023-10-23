const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
  price: {
    type: Number,
    default:null,

  },
  stock: {
    type: Number,
    default:0
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
    type: String,
    default:null
  },
  offer_end_date: {
    type: String,
    default:null
  },
  margin: {
    type: String,
  },
  vendorId:{
    type:String,
    required:true,
  }
});

const Variation = mongoose.model("Variation", variationSchema);

module.exports = Variation;
