var mongoose                = require('mongoose');

// User Schema
var OrderSchema = new mongoose.Schema({
    // full name, gsm, town address_type, address
    name: {
        type: String,
        required: true
    },
    gsm: {
        type: String,
        required: true
    },
    town: {
        type: String,
        required: true
    },
    address_type: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    }
});

var Order = module.exports = mongoose.model('Order', OrderSchema);