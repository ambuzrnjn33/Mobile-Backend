const mongoose = require('mongoose');

const Payment = new mongoose.Schema({

    
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required:true
    },

    otp: String,

    phone: String,

    createdAt: { type: Date, expires: '20m', default: Date.now }

}
)

module.exports = mongoose.model("otp", Payment)