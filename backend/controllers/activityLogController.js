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

// TODO: Make this work, currently not deleting any logs
// Delete Activity Logs
exports.deleteActivityLogsByActivityId = async (req, res) => {
  const { activityId } = req.params;
  try {
    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(activityId);
    console.log(objectId);

    // Delete logs with that ObjectId
    const result = await ActivityLog.deleteMany({ activityId: objectId });

    console.log(result);
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
