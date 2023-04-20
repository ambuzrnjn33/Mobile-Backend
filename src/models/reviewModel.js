const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        star: {
            type: Number,
            required: true
        },
        review: {
            type: String,
            required: true
        },
        accepted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Review", reviewSchema);