const mongoose = require('mongoose');

const shippingAddressSchema = new mongoose.Schema({
    first_name: {
        type: String,

    }, 
    last_name: {
        type: String,
    }
    ,
    street_address: {
        type: String,
    }
    ,
    city: {
        type: String,
    },
    state: {
        type: String,
    }
    ,
    postal_code:{
        type: String,

    },
    country: {
        type: String,
    }
    ,
    phone: {
        type: String,
    }
    ,company_name: {
        type: String,
    }
    ,
    apartment:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    delivery_instruction: {
        type: String,
    },
    user_id: {
        type: String,
    },
});
const ShippingAddress  = mongoose.model('ShippingAddress', shippingAddressSchema);

module.exports = ShippingAddress;