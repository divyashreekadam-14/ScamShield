function validateScan(req, res, next) {
  const { input, type } = req.body;

  const allowedTypes = [
    "message",
    "url",
    "qr",
    "upi",
    "text"
  ];

  if (typeof input !== "string") {
    return res.status(400).json({
      success: false,
      message: "Input must be text."
    });
  }

  const cleanInput = input.trim();

  if (!cleanInput) {
    return res.status(400).json({
      success: false,
      message: "Input cannot be empty."
    });
  }

  if (cleanInput.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "Input cannot exceed 5000 characters."
    });
  }

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid scan type."
    });
  }

  req.body.input = cleanInput;

  next();
}

function validateReport(req, res, next) {
  const { input, reason } = req.body;

  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({
      success: false,
      message: "Report content is required."
    });
  }

  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: "Report reason is required."
    });
  }

  if (input.length > 5000 || reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Report content is too long."
    });
  }

  next();
}

module.exports = {
  validateScan,
  validateReport
};