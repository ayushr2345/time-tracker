const express = require("express");
const router = express.Router();
const {
  getActivityLogs,
  addActivityLog,
  deleteActivityLogsByActivityId,
} = require("../controllers/activityLogController");

router.get("/", getActivityLogs);
router.post("/", addActivityLog);
router.delete("/:id", deleteActivityLogsByActivityId);

module.exports = router;
