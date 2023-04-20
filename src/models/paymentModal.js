const mongoose = require('mongoose');


const Payment = new mongoose.Schema({

    plan: {
        type: String,
        
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        required:true
    },
    transactionId: {
        type: String,
        required: true
    },
    user: String,

    orderId: String,

    duration: Number

},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Payment", Payment)
