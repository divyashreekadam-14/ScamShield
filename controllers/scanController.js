const Scan = require("../models/Scan");

const {
  analyzeContent,
  combineVirusTotalResult
} = require("../services/scamDetector");

const {
  checkUrlWithVirusTotal
} = require("../services/virusTotal");

async function scanInput(req, res, next) {
  try {
    const { input, type } = req.body;

    let analysis = analyzeContent(input, type);

    let virusTotal = {
      status: "unavailable",
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
      message: "VirusTotal check not required for this content."
    };

    if (type === "qr" || type === "url") {
      const url =
        analysis.extractedUrls.length > 0
          ? analysis.extractedUrls[0]
          : null;

      if (url) {
        virusTotal = await checkUrlWithVirusTotal(url);

        analysis = combineVirusTotalResult(
          analysis,
          virusTotal
        );
      }
    }

    const scan = await Scan.create({
      input,
      type: analysis.contentType === "upi" ? "upi" : type,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      reasons: analysis.reasons,
      recommendation: analysis.recommendation,
      virusTotal
    });

    res.status(201).json({
      success: true,
      message: "Scan completed successfully",
      analysis: {
        ...analysis,
        virusTotal,
        scanId: scan._id
      },
      scan
    });
  } catch (error) {
    console.error("SCAN ERROR:", error);
    next(error);
  }
}

async function getScanHistory(req, res, next) {
  try {
    const scans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      scans
    });
  } catch (error) {
    next(error);
  }
}

async function getScanById(req, res, next) {
  try {
    const scan = await Scan.findById(req.params.id).lean();

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found"
      });
    }

    res.json({
      success: true,
      scan
    });
  } catch (error) {
    next(error);
  }
}

async function getScanStats(req, res, next) {
  try {
    const [total, low, medium, high, critical] =
      await Promise.all([
        Scan.countDocuments(),
        Scan.countDocuments({ riskLevel: "LOW" }),
        Scan.countDocuments({ riskLevel: "MEDIUM" }),
        Scan.countDocuments({ riskLevel: "HIGH" }),
        Scan.countDocuments({ riskLevel: "CRITICAL" })
      ]);

    res.json({
      success: true,
      stats: {
        total,
        low,
        medium,
        high,
        critical
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  scanInput,
  getScanHistory,
  getScanById,
  getScanStats
};