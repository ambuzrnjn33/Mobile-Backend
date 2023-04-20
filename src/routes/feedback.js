const {
  uploadReviews,
  getAllReviews,
  deleteFeedback,
} = require("../controllers/feedback");

const express = require("express");

const routes = express.Router();

routes.post("/upload/:userId", uploadReviews);
routes.get("/", getAllReviews);
routes.delete("/:id", deleteFeedback);

module.exports = routes;
