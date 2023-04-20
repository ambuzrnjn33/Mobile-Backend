const mongoose = require('mongoose');

const Payment = new mongoose.Schema({

    
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required:true
    },

    comment: String,

    productId : {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        required:true
    },




}
)

module.exports = mongoose.model("comment", Payment)