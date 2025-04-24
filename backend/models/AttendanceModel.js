const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  location: {
    type: {
      lat: Number,
      lng: Number,
    },
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Attendance", attendanceSchema);
