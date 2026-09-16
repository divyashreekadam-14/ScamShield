function errorHandler(err, req, res, next) {
  console.error("❌ Server error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data submitted."
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID."
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
}

module.exports = errorHandler;