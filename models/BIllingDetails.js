const mongoose = require('mongoose');

const BillingDetailsSchema = new mongoose.Schema({
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
 
    user_id: {
        type: String,
    },
});
const BillingDetails  = mongoose.model('BillingDetails', BillingDetailsSchema);

module.exports = BillingDetails;