const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },

    email: { type: String, require: true, unique: true, trim: true },

    password: { type: String, require: true },

    profileImage: { type: String },

    phone: { type: String, required: true, unique: true, trim: true },

    gender: { type: String, enum: ["male", "female"] },

    address: { type: String, trim: true },

    latitude: { type: Number, default: -1 },

    longitude: { type: Number, default: -1 },

    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    //otp : String,

    //purchasedProd: [{type: mongoose.Schema.Types.ObjectId, ref: "Product"}],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);
