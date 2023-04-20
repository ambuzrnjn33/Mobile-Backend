const mongoose = require('mongoose');

const Payment = new mongoose.Schema({
    email:  String,
    phone: String,
    name: String,
    date: {type: Date}, 
    vendorId: {type: mongoose.Schema.Types.ObjectId, ref: "Vendor"},
    porductId: String


}
)

module.exports = mongoose.model("purchase", Payment)