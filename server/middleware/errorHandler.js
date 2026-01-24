// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  // Handle your custom ValidationError from middleware
  if (
    err.constructor.name === "ValidationError" &&
    err.code === "VALIDATION_ERROR"
  ) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.details?.errors || [],
      timestamp: err.timestamp,
    });
  }

  // Handle Mongoose ValidationError (different from your custom one)
  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Database Validation Error",
      errors,
    });
  }
  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate ${field} entered`,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }
  // Handle other custom AppError instances
  if (err.constructor.name === "AppError" || err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: err.timestamp,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
