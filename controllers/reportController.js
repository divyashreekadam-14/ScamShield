async function createReport(req, res, next) {
  try {
    const { input, reason } = req.body;

    console.log("🚨 ScamShield report received");

    console.log({
      input,
      reason,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "Thank you. The suspicious content has been reported."
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport
};