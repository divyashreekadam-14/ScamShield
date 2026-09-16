const express = require("express");

const {
  scanInput,
  getScanHistory,
  getScanById,
  getScanStats
} = require("../controllers/scanController");

const {
  validateScan
} = require("../middleware/validation");

const router = express.Router();

router.post("/", validateScan, scanInput);

router.get("/", getScanHistory);

router.get("/stats", getScanStats);

router.get("/:id", getScanById);

module.exports = router;