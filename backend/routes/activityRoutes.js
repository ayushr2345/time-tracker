const express = require("express");
const router = express.Router();
const {
  getActivities,
  addActivity,
  deleteActivity,
  getActivityName,
} = require("../controllers/activityController");

router.get("/", getActivities);
router.post("/", addActivity);
router.delete("/:id", deleteActivity);
router.get("/name/:id", getActivityName);

module.exports = router;
