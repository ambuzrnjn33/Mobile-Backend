const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId

const prodSchema = new mongoose.Schema({

    name: { type: String, required: true, trim: true},

    isDeleted: {type: Boolean, default: false},

    description: { type: String, required: true, trim: true},

    video: { type: String, required: true, trim: true},

    //storeId: {type: objectId, ref: "Store"},
 
    vendorId: {type: objectId, ref: "Vendor"},

    price: {type: Number, required: true},

    discount: {type: Number, default: 0},

    category: {type: String, required: true, trim: true}, 

    subCategory: String,

    // latitude: {type: Number, default: -1},

    // longtude: {type: Number, default: -1},

    location: {
        type: {type: String, default :"Point"},
        coordinates: {type : Array,  default: [-1, 1]}
      },

    tags: [String],

    sells: {type: Number, default: 0},

    rating: {type: Number, default: 1},

    totalReviews : {type: Number, default: 0}


}, {timestamps: true})

module.exports = mongoose.model("Product", prodSchema) 
prodSchema.index({ location: "2dsphere" }, (err, res)=>console.log(err, res));
