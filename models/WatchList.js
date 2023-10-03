const mongoose = require("mongoose");

const WatchListSchema = new mongoose.Schema({
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
      price: {
        type: Number,
      },
    },
  ],
});
const WatchList = mongoose.model("WatchList", WatchListSchema);

module.exports = WatchList;
