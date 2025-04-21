const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");

// Get all activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find();
    res.json(activityLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new activity log
exports.addActivityLog = async (req, res) => {
  const { activityId, startTime, endTime } = req.body;

  const activityLog = new ActivityLog({
    activityId,
    startTime,
    endTime,
  });

  try {
    const newActivityLog = await activityLog.save();
    res.status(201).json(newActivityLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Activity Logs
exports.deleteActivityLogsByActivityId = async (req, res) => {
  const activityId = req.params.id;
  try {
    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(activityId);

    // Delete logs with that ObjectId
    const result = await ActivityLog.deleteMany({ activityId: objectId });

    if (result.deletedCount > 0) {
      res.json({ message: "Activity logs deleted successfully" });
    } else {
      res
        .status(404)
        .json({ message: "No activity logs found with that activityId" });
    }
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Invalid activityId or something went wrong",
        error: error.message,
      });
  }
};
