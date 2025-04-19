const ActivityLog = require('../models/ActivityLog');

// Get all activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find().populate("activityId");
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
