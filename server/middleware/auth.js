// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");

// Verify JWT token
const { AppError } = require("../utils/errors");

const authenticate = async (req, res, next) => {
  console.log("Request body authjs:", req.body);

  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("no token access authiticate");
      throw new AppError("Access token required", 401, "NO_TOKEN");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError("Invalid token", 401, "INVALID_TOKEN");
    }
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 401, "UNAUTHORIZED");
    }

    req.user = user;
    console.log(req.user.role);

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions",
      });
    }

    next();
  };
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (user && user.isActive) {
          req.user = user;
        }
      } catch {
        // Ignore JWT errors for optional auth
      }
    }

    next();
  } catch {
    next();
  }
};

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || "Too many requests, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  500,
  "Too many authentication attempts, please try again later"
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  "Too many requests from this IP"
);

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  authLimiter,
  generalLimiter,
};
