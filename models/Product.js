const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
    vendorId: {type:String},
  categoryId: {type:String},
  variations: {type:Array},
  description: {type:String},

});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
