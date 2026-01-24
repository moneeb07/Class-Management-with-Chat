// models/Class.js - Production Ready
const mongoose = require("mongoose");
const BaseModel = require("./base/BaseModel");
const { CLASS_CONSTANTS, ERROR_CODES } = require("../utils/constants");
const {
  BusinessLogicError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");
const logger = require("../utils/logger");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      minlength: [
        CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN,
        `Class name must be at least ${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN} characters`,
      ],
      maxlength: [
        CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX,
        `Class name cannot exceed ${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX} characters`,
      ],
    },

    classCode: {
      type: String,
      uppercase: true,
      validate: {
        validator: function (v) {
          return CLASS_CONSTANTS.PATTERNS.CLASS_CODE.test(v);
        },
        message: "Class code must be exactly 3 digits",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX,
        `Description cannot exceed ${CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX} characters`,
      ],
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
      index: true,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [
        CLASS_CONSTANTS.LIMITS.SUBJECT_MAX,
        `Subject cannot exceed ${CLASS_CONSTANTS.LIMITS.SUBJECT_MAX} characters`,
      ],
    },

    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: {
        values: CLASS_CONSTANTS.SEMESTERS,
        message: `Semester must be one of: ${CLASS_CONSTANTS.SEMESTERS.join(
          ", "
        )}`,
      },
    },

    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      validate: {
        validator: function (v) {
          return CLASS_CONSTANTS.PATTERNS.ACADEMIC_YEAR.test(v);
        },
        message: "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    enrollmentKey: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || CLASS_CONSTANTS.PATTERNS.ENROLLMENT_KEY.test(v);
        },
        message: "Enrollment key must be exactly 6 digits",
      },
    },

    enrollmentKeyExpiry: {
      type: Date,
      default: function () {
        return new Date(
          Date.now() +
            CLASS_CONSTANTS.LIMITS.ENROLLMENT_KEY_EXPIRY_HOURS * 60 * 60 * 1000
        );
      },
    },

    maxStudents: {
      type: Number,
      default: CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_DEFAULT,
      min: [
        CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN,
        `Maximum students must be at least ${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN}`,
      ],
      max: [
        CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX,
        `Maximum students cannot exceed ${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX}`,
      ],
    },

    // Performance tracking
    metrics: {
      totalEnrollments: { type: Number, default: 0 },
      averageGrade: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      lastCalculated: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Add base model functionality
BaseModel.addCommonFields(classSchema);
BaseModel.addAuditFields(classSchema);

// Indexes
classSchema.index({ teacher: 1, isActive: 1 });
classSchema.index({ classCode: 1 }, { unique: true });
classSchema.index({ enrollmentKey: 1 }, { unique: true, sparse: true });
classSchema.index({ subject: 1, academicYear: 1, semester: 1 });
classSchema.index({ isDeleted: 1, isActive: 1 });
classSchema.index({ enrollmentKeyExpiry: 1 }, { expireAfterSeconds: 0 });

// Text search
classSchema.index(
  {
    className: "text",
    description: "text",
    subject: "text",
  },
  {
    weights: {
      className: 10,
      subject: 5,
      description: 1,
    },
  }
);

// Virtuals
classSchema.virtual("enrolledCount", {
  ref: "ClassEnrollment",
  localField: "_id",
  foreignField: "class",
  count: true,
  match: { status: "active", isDeleted: false },
});

classSchema.virtual("availableSpots").get(function () {
  const enrolled = this.enrolledCount || 0;
  return Math.max(0, this.maxStudents - enrolled);
});

classSchema.virtual("canEnroll").get(function () {
  return (
    this.isActive &&
    !this.isDeleted &&
    this.availableSpots > 0 &&
    this.enrollmentKey &&
    this.enrollmentKeyExpiry > new Date()
  );
});

// Middleware
classSchema.pre("save", async function (next) {
  try {
    if (!this.classCode) {
      this.classCode = await this.constructor.generateUniqueClassCode();
    }

    if (!this.enrollmentKey && this.isActive) {
      this.enrollmentKey = await this.constructor.generateUniqueEnrollmentKey();
      this.enrollmentKeyExpiry = new Date(
        Date.now() +
          CLASS_CONSTANTS.LIMITS.ENROLLMENT_KEY_EXPIRY_HOURS * 60 * 60 * 1000
      );
    }

    // Log important changes
    if (this.isModified("isActive")) {
      logger.info(
        `Class ${this.classCode} active status changed to: ${this.isActive}`,
        {
          classId: this._id,
          teacherId: this.teacher,
        }
      );
    }

    next();
  } catch (error) {
    logger.error("Error in Class pre-save middleware:", error);
    next(
      new BusinessLogicError(
        `Failed to generate codes: ${error.message}`,
        ERROR_CODES.CODE_GENERATION_FAILED
      )
    );
  }
});

// Static Methods
classSchema.statics.generateUniqueClassCode = async function (
  maxAttempts = 100
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const classCode = Math.floor(100 + Math.random() * 900).toString();

    const existing = await this.findOne({ classCode });
    if (!existing) {
      return classCode;
    }
  }

  throw new BusinessLogicError(
    "Unable to generate unique class code",
    ERROR_CODES.CODE_GENERATION_FAILED
  );
};

classSchema.statics.generateUniqueEnrollmentKey = async function (
  maxAttempts = 100
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const enrollmentKey = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const existing = await this.findOne({
      enrollmentKey,
      enrollmentKeyExpiry: { $gt: new Date() },
    });

    if (!existing) {
      return enrollmentKey;
    }
  }

  throw new BusinessLogicError(
    "Unable to generate unique enrollment key",
    ERROR_CODES.KEY_GENERATION_FAILED
  );
};

classSchema.statics.findActiveByTeacher = function (teacherId, options = {}) {
  const {
    page = 1,
    limit = 10,
    semester = null,
    academicYear = null,
    search = null,
  } = options;

  let query = this.find({
    teacher: teacherId,
    isActive: true,
  });

  if (semester) query = query.where("semester").equals(semester);
  if (academicYear) query = query.where("academicYear").equals(academicYear);
  if (search) {
    query = query.where({ $text: { $search: search } });
  }

  return query
    .populate("enrolledCount")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

classSchema.statics.findByEnrollmentKey = async function (enrollmentKey) {
  const classDoc = await this.findOne({
    enrollmentKey,
    enrollmentKeyExpiry: { $gt: new Date() },
    isActive: true,
  }).populate("teacher", "name email");

  if (!classDoc) {
    throw new NotFoundError("Valid enrollment key");
  }

  return classDoc;
};

// Instance Methods
classSchema.methods.regenerateEnrollmentKey = async function () {
  this.enrollmentKey = await this.constructor.generateUniqueEnrollmentKey();
  this.enrollmentKeyExpiry = new Date(
    Date.now() +
      CLASS_CONSTANTS.LIMITS.ENROLLMENT_KEY_EXPIRY_HOURS * 60 * 60 * 1000
  );

  logger.info(`Enrollment key regenerated for class: ${this.classCode}`, {
    classId: this._id,
    teacherId: this.teacher,
  });

  return this.save();
};

classSchema.methods.getEnrollmentStats = async function () {
  const ClassEnrollment = mongoose.model("ClassEnrollment");

  const stats = await ClassEnrollment.aggregate([
    { $match: { class: this._id, isDeleted: false } },
    {
      $facet: {
        // 1. Per-status stats
        perStatus: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        // 2. Overall averages
        overall: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              averageGrade: { $avg: "$finalGrade" },
              averageAttendance: { $avg: "$attendance" },
            },
          },
        ],
      },
    },
  ]);

  const formatted = {
    total: 0,
    active: 0,
    completed: 0,
    dropped: 0,
    averageGrade: 0,
    averageAttendance: 0,
  };

  if (!stats.length) return formatted;

  // Fill per-status counts
  for (const s of stats[0].perStatus) {
    formatted[s._id] = s.count;
  }

  // Fill overall stats
  if (stats[0].overall.length > 0) {
    const overall = stats[0].overall[0];
    formatted.total = overall.total || 0;
    formatted.averageGrade =
      overall.averageGrade !== null
        ? Math.round(overall.averageGrade * 100) / 100
        : 0;
    formatted.averageAttendance =
      overall.averageAttendance !== null
        ? Math.round(overall.averageAttendance * 100) / 100
        : 0;
  }

  return formatted;
};

classSchema.methods.deactivate = async function (
  reason = "Manual deactivation"
) {
  this.isActive = false;
  this.enrollmentKey = undefined;
  this.enrollmentKeyExpiry = undefined;

  logger.info(`Class deactivated: ${this.classCode}`, {
    classId: this._id,
    reason,
    teacherId: this.teacher,
  });

  return this.save();
};

classSchema.methods.updateMetrics = async function () {
  const ClassEnrollment = mongoose.model("ClassEnrollment");

  const stats = await ClassEnrollment.aggregate([
    { $match: { class: this._id, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedEnrollments: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        averageGrade: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne: ["$finalGrade", null] },
                  { $eq: ["$status", "completed"] },
                ],
              },
              "$finalGrade",
              null,
            ],
          },
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const stat = stats[0];
    this.metrics = {
      totalEnrollments: stat.totalEnrollments || 0,
      averageGrade: Math.round((stat.averageGrade || 0) * 100) / 100,
      completionRate:
        stat.totalEnrollments > 0
          ? Math.round(
              (stat.completedEnrollments / stat.totalEnrollments) * 100 * 100
            ) / 100
          : 0,
      lastCalculated: new Date(),
    };
  }

  return this.save();
};

module.exports = mongoose.model("Class", classSchema);
