const mongoose = require("mongoose");

const virusTotalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: "unavailable"
    },
    malicious: {
      type: Number,
      default: 0
    },
    suspicious: {
      type: Number,
      default: 0
    },
    harmless: {
      type: Number,
      default: 0
    },
    undetected: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      default: ""
    }
  },
  {
    _id: false
  }
);

const scanSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true
    },

    type: {
      type: String,
      enum: ["message", "url", "qr", "upi", "text"],
      required: true
    },

    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true
    },

    reasons: {
      type: [String],
      default: []
    },

    recommendation: {
      type: String,
      required: true
    },

    virusTotal: {
      type: virusTotalSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Scan", scanSchema);