const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId

const vendorSchema = new mongoose.Schema({

    name: { type: String, trim: true},

    isDeleted: {type: Boolean, default: false},

    description: { type: String, trim: true},

    savedProducts: [{ type: objectId, ref: "Product"}],

    email: {type: String, require: true, unique: true, trim: true},

    password: {type: String, require: true},

    profileImage: { type: String},

    phone: { type: String, required: true, unique: true, trim: true },

    gender: {type: String, enum: ["male", "female"]},

    plan : {type: String, default: "basic", enum: ["basic", "standard", "business"]},



    address: {type: String,  trim: true},

    latitude: Number,

    longitude: Number,

    isDeleted: {type: Boolean, default: false},

    storeName: String


}, {timestamps: true})

module.exports = mongoose.model("Vendor", vendorSchema)