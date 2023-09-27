const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  products: [
    {
      productId: {
        type: String,
      },
      variationId: {
        type: String,
      },
      count: {
        type: Number,
      },
      price: {
        type: Number,
      },
    },
  ],
});
const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
