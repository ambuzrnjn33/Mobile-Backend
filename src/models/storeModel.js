const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId


const storeSchema = new mongoose.Schema({

    storeName: { type: String, required: true, trim: true},

    isDeleted: {type: Boolean, default: false},

    description: String,

    vendorId: {type: objectId, ref: "Vendor"}, 

    address: {type: String, required: true, trim: true},

}, {timestamps: true})

module.exports = mongoose.model("Store", storeSchema)