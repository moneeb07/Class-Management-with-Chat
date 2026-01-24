// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  return { accessToken, refreshToken };
};

// Helper function to set secure refresh token cookie
const setRefreshTokenCookie = (res, refreshToken, rememberMe = false) => {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/", // Available across the entire app
  });
};

// Helper function to sanitize user response
const sanitizeUserResponse = (user) => {
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;
  delete userResponse.__v;
  return userResponse;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = "student",
      studentId,
      employeeId,
      department,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Role-specific validations
    if (role === "student") {
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Student ID is required for student role",
          code: "STUDENT_ID_REQUIRED",
        });
      }

      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "Student ID already exists",
          code: "STUDENT_ID_EXISTS",
        });
      }
    }

    if (role === "teacher") {
      if (!employeeId || !department) {
        return res.status(400).json({
          success: false,
          message: "Employee ID and department are required for teacher role",
          code: "TEACHER_FIELDS_REQUIRED",
        });
      }

      const existingTeacher = await User.findOne({ employeeId });
      if (existingTeacher) {
        return res.status(409).json({
          success: false,
          message: "Employee ID already exists",
          code: "EMPLOYEE_ID_EXISTS",
        });
      }
    }

    // Create user data object
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    };

    if (role === "student") {
      userData.studentId = studentId.trim();
    } else if (role === "teacher") {
      userData.employeeId = employeeId.trim();
      userData.department = department.trim();
    }

    // Create user
    const user = await User.create(userData);

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token in database
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"] || "Unknown",
        },
      },
    });

    // Set refresh token cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Sanitize user response
    const userResponse = sanitizeUserResponse(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: userResponse,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        code: "VALIDATION_ERROR",
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        success: false,
        message: `${field} '${value}' already exists`,
        code: "DUPLICATE_FIELD",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      code: "INTERNAL_SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Find user with credentials
    const user = await User.findByCredentials(
      email.toLowerCase().trim(),
      password
    );

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token in DB with appropriate expiry
    const expiryDays = rememberMe ? 30 : 7;
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"] || "Unknown",
        },
      },
    });

    // Set refresh token cookie
    setRefreshTokenCookie(res, tokens.refreshToken, rememberMe);

    // Sanitize user response
    const userResponse = sanitizeUserResponse(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle authentication errors
    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Handle rate limiting (if implemented)
    if (error.message === "Too many login attempts") {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Login failed",
      code: "INTERNAL_SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find user and check if refresh token exists in DB
    const user = await User.findOne({
      _id: decoded.userId,
      "refreshTokens.token": refreshToken,
      "refreshTokens.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Rotate refresh token - replace old with new
    await User.findOneAndUpdate(
      { _id: user._id, "refreshTokens.token": refreshToken },
      {
        $set: {
          "refreshTokens.$.token": tokens.refreshToken,
          "refreshTokens.$.expiresAt": new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
          "refreshTokens.$.lastUsed": new Date(),
        },
      }
    );

    // Set new refresh token cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    // Handle different JWT errors
    let message = "Invalid refresh token";
    let code = "INVALID_REFRESH_TOKEN";

    if (error.name === "TokenExpiredError") {
      message = "Refresh token expired";
      code = "REFRESH_TOKEN_EXPIRED";
    } else if (error.name === "JsonWebTokenError") {
      message = "Malformed refresh token";
      code = "MALFORMED_REFRESH_TOKEN";
    }

    res.status(401).json({
      success: false,
      message,
      code,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const refreshToken = req.cookies.refreshToken;

    // Remove refresh token from database
    if (refreshToken) {
      await User.findByIdAndUpdate(userId, {
        $pull: {
          refreshTokens: { token: refreshToken },
        },
      });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      code: "LOGOUT_ERROR",
    });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { refreshTokens: [] },
    });

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Logout from all devices failed",
      code: "LOGOUT_ALL_ERROR",
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "-password -refreshTokens -__v -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires"
      )
      .populate("enrolledClasses.classId", "className subject teacher")
      .populate("createdClasses", "className subject studentCount");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
        code: "ACCOUNT_INACTIVE",
      });
    }
    res.set("Cache-Control", "no-store"); // 🚫 no caching

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      code: "PROFILE_FETCH_ERROR",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, department } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio: bio ? bio.trim() : "",
    };

    // Only teachers can update department
    if (req.user.role === "teacher" && department) {
      updateData.department = department.trim();
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Profile update failed",
      code: "PROFILE_UPDATE_ERROR",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
        code: "MISSING_PASSWORDS",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
        code: "WEAK_PASSWORD",
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        code: "INCORRECT_CURRENT_PASSWORD",
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
        code: "SAME_PASSWORD",
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;

    // Invalidate all existing refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Password change failed",
      code: "PASSWORD_CHANGE_ERROR",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        code: "EMAIL_REQUIRED",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If a user with this email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Here you would typically send an email with the reset token
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    // TODO: Send email with resetUrl
    // await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
      ...(process.env.NODE_ENV === "development" && {
        resetUrl,
        resetToken,
        note: "In development mode - use this token to reset password",
      }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset request failed",
      code: "FORGOT_PASSWORD_ERROR",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
        code: "PASSWORD_REQUIRED",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        code: "WEAK_PASSWORD",
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        code: "INVALID_RESET_TOKEN",
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Clear all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    // Generate new tokens
    const tokens = generateTokens(user);

    // Store new refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.headers["user-agent"] || "Unknown",
        },
      },
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      code: "RESET_PASSWORD_ERROR",
    });
  }
};

// @desc    Clean up expired refresh tokens (utility function)
// @route   POST /api/auth/cleanup-tokens (admin only)
// @access  Private/Admin
const cleanupExpiredTokens = async (req, res) => {
  try {
    const result = await User.updateMany(
      {},
      {
        $pull: {
          refreshTokens: {
            expiresAt: { $lt: new Date() },
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `Cleaned up expired tokens from ${result.modifiedCount} users`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Token cleanup error:", error);
    res.status(500).json({
      success: false,
      message: "Token cleanup failed",
      code: "TOKEN_CLEANUP_ERROR",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  cleanupExpiredTokens,
};

// // controllers/authController.js
// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");

// // Helper function to generate tokens
// const generateTokens = (user) => {
//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();
//   return { accessToken, refreshToken };
// };

// // Helper function to set secure cookies
// const setRefreshTokenCookie = (res, refreshToken) => {
//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   });
// };

// // @desc    Register new user
// // @route   POST /api/auth/register
// // @access  Public
// const register = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       password,
//       role,
//       studentId,
//       employeeId,
//       department,
//     } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists with this email",
//       });
//     }

//     // Check for duplicate student/employee ID
//     if (role === "student" && studentId) {
//       const existingStudent = await User.findOne({ studentId });
//       if (existingStudent) {
//         return res.status(400).json({
//           success: false,
//           message: "Student ID already exists",
//         });
//       }
//     }

//     if (role === "teacher" && employeeId) {
//       const existingTeacher = await User.findOne({ employeeId });
//       if (existingTeacher) {
//         return res.status(400).json({
//           success: false,
//           message: "Employee ID already exists",
//         });
//       }
//     }

//     // Create user
//     const userData = {
//       firstName,
//       lastName,
//       email,
//       password,
//       role,
//     };

//     if (role === "student") {
//       userData.studentId = studentId;
//     } else if (role === "teacher") {
//       userData.employeeId = employeeId;
//       userData.department = department;
//     }

//     const user = await User.create(userData);
//     console.log("reached");

//     // Generate tokens
//     const tokens = generateTokens(user);

//     console.log(tokens);
//     // Store refresh token in database
//     await User.findByIdAndUpdate(user._id, {
//       $push: {
//         refreshTokens: {
//           token: tokens.refreshToken,
//           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//           userAgent: req.headers["user-agent"],
//         },
//       },
//     });
//     // Set cookies
//     // setTokenCookies(res, tokens);
//     setRefreshTokenCookie(res, tokens.refreshToken);

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     res.status(201).json({
//       success: true,
//       message: "Registration successful",
//       // TO this:
//       data: {
//         user: userResponse,
//         accessToken: tokens.accessToken, // ✅ Only access token
//       },
//     });
//   } catch (error) {
//     console.error("Registration error 131:", error);

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyValue)[0];
//       return res.status(400).json({
//         success: false,
//         message: `${field} already exists`,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Registration failed",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public

// const login = async (req, res) => {
//   try {
//     const { email, password, rememberMe } = req.body;
//     // 1. Find user with credentials ( User.findByCredentials does email + password check)
//     const user = await User.findByCredentials(email, password);

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }
//     // 2. Check if account is active
//     if (user.isActive === false) {
//       return res.status(403).json({
//         success: false,
//         message: "Your account has been deactivated. Please contact support.",
//       });
//     }

//     // 3. Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // 4. Generate tokens
//     const tokens = generateTokens(user);

//     // 5. Store refresh token in DB
//     await User.findByIdAndUpdate(user._id, {
//       $push: {
//         refreshTokens: {
//           token: tokens.refreshToken,
//           expiresAt: new Date(
//             Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000 // 30 days if rememberMe
//           ),
//           userAgent: req.headers["user-agent"],
//         },
//       },
//     });

//     // 6. Set ONLY refresh token in httpOnly cookie
//     setRefreshTokenCookie(res, tokens.refreshToken, rememberMe);

//     // 7. Sanitize user response (remove sensitive fields)
//     const userResponse = user.toObject();
//     delete userResponse.password;
//     delete userResponse.refreshTokens; // prevent leaking refresh tokens

//     // 8. Success response
//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: {
//         user: userResponse,
//         accessToken: tokens.accessToken, // ✅ only access token returned
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);

//     // Handle specific known errors
//     if (error.message === "Invalid email or password") {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     // Fallback: internal server error
//     return res.status(500).json({
//       success: false,
//       message: "Login failed",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// const logout = async (req, res) => {
//   try {
//     const userId = req.user.id; // Make sure you have auth middleware
//     const refreshToken = req.cookies.refreshToken;

//     // Remove refresh token from database
//     if (refreshToken) {
//       await User.findByIdAndUpdate(userId, {
//         $pull: {
//           refreshTokens: { token: refreshToken },
//         },
//       });
//     }

//     // Clear cookie
//     res.clearCookie("refreshToken");
//     // Don't clear accessToken cookie since we're not using it

//     res.status(200).json({
//       success: true,
//       message: "Logout successful",
//     });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Logout failed",
//     });
//   }
// };
// // @desc    Get current user profile
// // @route   GET /api/auth/me
// // @access  Private
// const getMe = async (req, res) => {
//   console.log("reached get me");

//   try {
//     const user = await User.findById(req.user.id).select(
//       "-password -refreshTokens -__v"
//     );
//     // .populate("enrolledClasses.classId", "className subject teacher")
//     // .populate("createdClasses", "className subject studentCount");

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Get profile error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch profile",
//     });
//   }
// };

// // @desc    Update user profile
// // @route   PUT /api/auth/profile
// // @access  Private
// const updateProfile = async (req, res) => {
//   try {
//     const { firstName, lastName, bio, department } = req.body;

//     const updateData = {
//       firstName,
//       lastName,
//       bio,
//     };

//     // Only teachers can update department
//     if (req.user.role === "teacher" && department) {
//       updateData.department = department;
//     }

//     const user = await User.findByIdAndUpdate(req.user.id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       data: { user },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Profile update failed",
//     });
//   }
// };

// // @desc    Change password
// // @route   PUT /api/auth/change-password
// // @access  Private
// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     // Get user with password
//     const user = await User.findById(req.user.id).select("+password");

//     // Check current password
//     const isCurrentPasswordValid = await user.comparePassword(currentPassword);
//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: "Current password is incorrect",
//       });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Password changed successfully",
//     });
//   } catch (error) {
//     console.error("Change password error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Password change failed",
//     });
//   }
// };
// const refreshToken = async (req, res) => {
//   try {
//     // Debug logging
//     console.log("=== REFRESH TOKEN DEBUG ===");
//     console.log("All cookies:", req.cookies);
//     console.log("Refresh token from cookie:", req.cookies.refreshToken);
//     console.log("Headers:", req.headers);

//     const refreshToken = req.cookies.refreshToken;

//     if (!refreshToken) {
//       console.log("❌ No refresh token found in cookies");
//       return res.status(401).json({
//         success: false,
//         message: "Refresh token not found",
//       });
//     }

//     console.log("✅ Refresh token found, verifying...");

//     // Verify refresh token
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     console.log("✅ Token verified, decoded:", { userId: decoded.userId });
//     console.log(refreshToken);

//     // Find user and check if refresh token exists in DB
//     const user = await User.findOne({
//       _id: decoded.userId,
//       "refreshTokens.token": refreshToken,
//       "refreshTokens.expiresAt": { $gt: new Date() },
//     });

//     if (!user) {
//       console.log("❌ User not found or token not in DB");
//       return res.status(401).json({
//         success: false,
//         message: "Invalid refresh token",
//       });
//     }

//     if (!user.isActive) {
//       console.log("❌ User is not active");
//       return res.status(401).json({
//         success: false,
//         message: "User account is inactive",
//       });
//     }

//     console.log("✅ User found and active, generating new tokens...");

//     // Generate new tokens
//     const tokens = generateTokens(user);

//     // ROTATE refresh token - replace old with new
//     await User.findOneAndUpdate(
//       { _id: user._id, "refreshTokens.token": refreshToken },
//       {
//         $set: {
//           "refreshTokens.$.token": tokens.refreshToken,
//           "refreshTokens.$.expiresAt": new Date(
//             Date.now() + 7 * 24 * 60 * 60 * 1000
//           ),
//         },
//       }
//     );

//     console.log("✅ Database updated with new refresh token");

//     // Set new refresh token cookie
//     setRefreshTokenCookie(res, tokens.refreshToken);

//     console.log("✅ New refresh token cookie set");
//     console.log("=== END DEBUG ===");

//     res.status(200).json({
//       success: true,
//       data: {
//         accessToken: tokens.accessToken,
//       },
//     });
//   } catch (error) {
//     console.log("❌ Refresh token error:", error.message);
//     res.status(401).json({
//       success: false,
//       message: "Invalid refresh token",
//     });
//   }
// };

// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found with this email",
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     user.passwordResetToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

//     await user.save();

//     // Here you would typically send an email with the reset token
//     // For now, we'll just return it in development mode
//     const resetUrl = `${req.protocol}://${req.get(
//       "host"
//     )}/api/auth/reset-password/${resetToken}`;

//     res.status(200).json({
//       success: true,
//       message: "Password reset token sent to email",
//       ...(process.env.NODE_ENV === "development" && { resetUrl, resetToken }),
//     });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Password reset request failed",
//     });
//   }
// };

// // @desc    Reset password
// // @route   PUT /api/auth/reset-password/:token
// // @access  Public
// const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     // Hash the token
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     // Find user with valid reset token
//     const user = await User.findOne({
//       passwordResetToken: hashedToken,
//       passwordResetExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired reset token",
//       });
//     }

//     // Update password and clear reset token
//     user.password = password;
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;

//     user.refreshTokens = [];
//     await user.save();

//     // Generate new tokens
//     const tokens = generateTokens(user);
//     await User.findByIdAndUpdate(user._id, {
//       $push: {
//         refreshTokens: {
//           token: tokens.refreshToken,
//           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//           userAgent: req.headers["user-agent"],
//         },
//       },
//     });
//     setRefreshTokenCookie(res, tokens.refreshToken);

//     res.status(200).json({
//       success: true,
//       message: "Password reset successful",
//       data: { accessToken: tokens.accessToken },
//     });
//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Password reset failed",
//     });
//   }
// };
// const logoutAll = async (req, res) => {
//   try {
//     await User.findByIdAndUpdate(req.user.id, {
//       $set: { refreshTokens: [] },
//     });

//     res.clearCookie("refreshToken");

//     res.status(200).json({
//       success: true,
//       message: "Logged out from all devices",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Logout failed",
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   logout,
//   getMe,
//   updateProfile,
//   changePassword,
//   refreshToken,
//   forgotPassword,
//   resetPassword,
//   logoutAll,
// };
