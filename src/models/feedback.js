const mongoose = require("mongoose");

const Payment = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    services: {
      type: Number,
      required: true,
    },
    helpfull: {
      type: Number,
      required: true,
    },
    video: {
      type: Number,
      required: true,
    },
    audio: {
      type: Number,
      required: true,
    },
    satisfaction: {
      type: Number,
      required: true,
    },
    care: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("feedback", Payment);
