const express = require('express');
const router = express.Router();
const {
  getActivities,
  addActivity,
  deleteActivity
} = require('../controllers/activityController');

router.get('/', getActivities);
router.post('/', addActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
