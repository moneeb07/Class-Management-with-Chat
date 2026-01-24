// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },

    // Role & Profile
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    // Add this field to userSchema
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        userAgent: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Academic Info
    department: {
      type: String,
      required: function () {
        return this.role === "teacher";
      },
    },
    studentId: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    employeeId: {
      type: String,
      required: function () {
        return this.role === "teacher";
      },
      unique: true,
      sparse: true,
    },

    // Security & Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,

    // Student Specific
    enrolledClasses: [
      {
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "dropped", "completed"],
          default: "active",
        },
      },
    ],

    // Teacher Specific
    createdClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    // Performance Tracking
    totalAssignments: {
      type: Number,
      default: 0,
    },
    completedAssignments: {
      type: Number,
      default: 0,
    },
    averageGrade: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Remove duplicate indexes - these are already created by unique: true in schema
// COMMENT OUT OR REMOVE THESE LINES:
// userSchema.index({ email: 1 });      // Duplicate - email already has unique: true
// userSchema.index({ studentId: 1 });  // Duplicate - studentId already has unique: true
// userSchema.index({ employeeId: 1 }); // Duplicate - employeeId already has unique: true

// Keep only indexes that aren't already defined with unique: true
userSchema.index({ role: 1 }); // This one is fine since role doesn't have unique: true

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it's modified
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate short-lived access token
userSchema.methods.generateAccessToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    type: "access",
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15d", // Short-lived   temp set to 15d but 15m
  });
};

// Generate long-lived refresh token
userSchema.methods.generateRefreshToken = function () {
  const payload = {
    userId: this._id,
    type: "refresh",
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // Long-lived
  });
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
