const mongoose = require("mongoose");

// Connect to the MongoDB database
mongoose.connect("mongodb+srv://gdarcri:l0m0fvh.s03313@arcrimining.ffywd4x.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", error => {
  console.error("MongoDB connection error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = db;