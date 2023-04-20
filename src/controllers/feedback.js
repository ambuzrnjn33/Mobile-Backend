const Feedback = require("../models/feedback");
const User = require("../models/userModel");

const uploadReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("Invalid user id");
    }
    const newFeedback = await Feedback.create({ userId: userId, ...req.body });

    res.status(200).json(newFeedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({});
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const data = await Feedback.findByIdAndDelete(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = { getAllReviews, uploadReviews, deleteFeedback };
