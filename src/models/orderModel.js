const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId

const puSchema = new mongoose.Schema({

    productId: {type: mongoose.Schema.Types.ObjectId, ref: "Product"},

    vendorId: {type: mongoose.Schema.Types.ObjectId, ref: "Vendor"},

    payment : {type: mongoose.Schema.Types.ObjectId, ref: "Payment"},
    
    userId : {type: mongoose.Schema.Types.ObjectId, ref: "Users"},

    billingAddress: String

}, {timestamps: true}) 
module.exports = mongoose.model("order", puSchema)