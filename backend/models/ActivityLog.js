const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity", // Reference to the activity collection
      required: true,
    },
    startTime: {
      type: String, // Storing time as string (HH:MM format)
      required: true,
    },
    endTime: {
      type: String, // Storing time as string (HH:MM format)
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
