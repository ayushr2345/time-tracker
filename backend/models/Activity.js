const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#000000'
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
