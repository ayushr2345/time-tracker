const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  addActivityLog,
} = require('../controllers/activityLogController');

router.get('/', getActivityLogs);
router.post('/', addActivityLog);

module.exports = router;
