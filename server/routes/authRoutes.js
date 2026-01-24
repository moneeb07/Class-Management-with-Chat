// routes/authRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutAll,
} = require("../controllers/authController");
const { authenticate, authLimiter } = require("../middleware/auth");
const { authValidation } = require("../middleware/authValidation");

const router = express.Router();

// Public routes
router.post("/register", authLimiter, authValidation.register, register);
router.post("/login", authLimiter, authValidation.login, login);
router.post("/refresh-token", refreshToken);
router.post("/logout-all", logoutAll);
router.post(
  "/forgot-password",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
  ],
  forgotPassword
);
router.put(
  "/reset-password/:token",
  authLimiter,
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Password must contain uppercase, lowercase, number and special character"
      ),
  ],
  resetPassword
);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put(
  "/profile",
  authenticate,
  [
    body("firstName").optional().trim().isLength({ min: 2, max: 50 }),
    body("lastName").optional().trim().isLength({ min: 2, max: 50 }),
    body("bio").optional().isLength({ max: 500 }),
    body("department").optional().trim().isLength({ min: 2, max: 100 }),
  ],
  updateProfile
);
router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "New password must contain uppercase, lowercase, number and special character"
      ),
  ],
  changePassword
);

module.exports = router;
