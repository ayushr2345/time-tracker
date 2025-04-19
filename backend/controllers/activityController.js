const Activity = require('../models/Activity');

// Get all activities
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add activity
exports.addActivity = async (req, res) => {
  const { name, color } = req.body;
  try {
    const newActivity = new Activity({ name, color });
    const savedActivity = await newActivity.save();
    res.status(201).json(savedActivity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    await Activity.findByIdAndDelete(id);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(404).json({ error: 'Activity not found' });
  }
};
