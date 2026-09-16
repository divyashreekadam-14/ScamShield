const express = require("express");

const {
  createReport
} = require("../controllers/reportController");

const {
  validateReport
} = require("../middleware/validation");

const router = express.Router();

router.post("/", validateReport, createReport);

module.exports = router;