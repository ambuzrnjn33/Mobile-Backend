const mongoose = require('mongoose');

const Payment = new mongoose.Schema({

    title :  {type: String, required: true},

    description: String,

    subTitle: String,

    price: {type: Number, default: 0},

    duration: Number


}
)

module.exports = mongoose.model("plan", Payment)