// models/ClassEnrollment.js - Production Ready
const mongoose = require("mongoose");
const BaseModel = require("./base/BaseModel");
const { CLASS_CONSTANTS, ERROR_CODES } = require("../utils/constants");
const logger = require("../utils/logger");
const {
  BusinessLogicError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");

const classEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
      index: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: CLASS_CONSTANTS.ENROLLMENT_STATUS,
        message: `Status must be one of: ${CLASS_CONSTANTS.ENROLLMENT_STATUS.join(
          ", "
        )}`,
      },
      default: "active",
      index: true,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    finalGrade: {
      type: Number,
      min: [
        CLASS_CONSTANTS.LIMITS.GRADE_MIN,
        `Grade cannot be less than ${CLASS_CONSTANTS.LIMITS.GRADE_MIN}`,
      ],
      max: [
        CLASS_CONSTANTS.LIMITS.GRADE_MAX,
        `Grade cannot exceed ${CLASS_CONSTANTS.LIMITS.GRADE_MAX}`,
      ],
      validate: {
        validator: function (v) {
          return this.status !== "completed" || (v >= 0 && v <= 100);
        },
        message:
          "Final grade is required and must be 0-100 for completed enrollments",
      },
    },

    attendance: {
      type: Number,
      min: [
        CLASS_CONSTANTS.LIMITS.ATTENDANCE_MIN,
        "Attendance cannot be negative",
      ],
      max: [
        CLASS_CONSTANTS.LIMITS.ATTENDANCE_MAX,
        "Attendance cannot exceed 100%",
      ],
      default: 100,
    },

    enrollmentSource: {
      type: String,
      enum: CLASS_CONSTANTS.ENROLLMENT_SOURCES,
      default: "enrollment_key",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: CLASS_CONSTANTS.ENROLLMENT_STATUS,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
      },
    ],

    droppedAt: Date,
    completedAt: Date,
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
BaseModel.addCommonFields(classEnrollmentSchema);
BaseModel.addAuditFields(classEnrollmentSchema);

// Indexes
classEnrollmentSchema.index({ student: 1, class: 1 }, { unique: true });
classEnrollmentSchema.index({ class: 1, status: 1 });
classEnrollmentSchema.index({ student: 1, status: 1 });
classEnrollmentSchema.index({ enrolledAt: 1 });

// Virtuals
classEnrollmentSchema.virtual("duration").get(function () {
  const endDate = this.droppedAt || this.completedAt || new Date();
  return Math.floor((endDate - this.enrolledAt) / (1000 * 60 * 60 * 24));
});

classEnrollmentSchema.virtual("letterGrade").get(function () {
  if (!this.finalGrade) return null;

  const grade = this.finalGrade;
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
});

// Middleware
classEnrollmentSchema.pre("save", function (next) {
  // Track status changes
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.updatedBy,
    });

    // Set timestamps
    const now = new Date();
    if (this.status === "dropped" && !this.droppedAt) {
      this.droppedAt = now;
    } else if (this.status === "completed" && !this.completedAt) {
      this.completedAt = now;
    }

    // Clear inappropriate timestamps
    if (this.status !== "dropped") this.droppedAt = undefined;
    if (this.status !== "completed") this.completedAt = undefined;

    logger.info(`Enrollment status changed`, {
      enrollmentId: this._id,
      studentId: this.student,
      classId: this.class,
      newStatus: this.status,
    });
  }

  next();
});

// Static Methods
// Get student enrollments with optional status, population, and sorting
classEnrollmentSchema.statics.getStudentEnrollments = function (
  studentId,
  { status = null, populate = false, sort = "-enrolledAt" } = {}
) {
  let query = this.find({ student: studentId });

  if (status) {
    query = query.where("status").equals(status);
  }

  if (populate) {
    query = query
      .populate({
        path: "student",
        select: "firstName lastName email fullName avatar",
      })
      .populate({
        path: "class",
        select:
          "className classCode subject teacher semester academicYear isActive",
        populate: {
          path: "teacher",
          select: "firstName lastName email fullName avatar",
        },
      });
  }

  if (sort) {
    query = query.sort(sort);
  }

  return query;
};

// Get class enrollments with optional status, population, and sorting
classEnrollmentSchema.statics.getClassEnrollments = function (
  classId,
  { status = null, populate = false, sort = "enrolledAt" } = {}
) {
  let query = this.find({ class: classId });

  if (status) {
    query = query.where("status").equals(status);
  }

  if (populate) {
    query = query.populate({
      path: "student",
      select: "firstName lastName email fullName avatar",
    });
  }

  if (sort) {
    query = query.sort(sort);
  }

  return query;
};

classEnrollmentSchema.statics.enrollStudent = async function (
  studentId,
  classId,
  enrollmentKey = null,
  options = {}
) {
  const Class = mongoose.model("Class");
  const session = options.session || null;

  try {
    // Check existing enrollment
    const existingEnrollment = await this.findOne({
      student: studentId,
      class: classId,
      status: { $in: ["active", "completed"] },
    }).session(session);

    if (existingEnrollment) {
      throw new ConflictError("Student is already enrolled in this class");
    }

    // Validate class
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    if (!classDoc.isActive) {
      throw new BusinessLogicError(
        "Class is not active for enrollment",
        ERROR_CODES.CLASS_INACTIVE
      );
    }

    // Validate enrollment key
    if (enrollmentKey && classDoc.enrollmentKey !== enrollmentKey) {
      throw new BusinessLogicError(
        "Invalid enrollment key",
        ERROR_CODES.INVALID_ENROLLMENT_KEY
      );
    }

    if (enrollmentKey && classDoc.enrollmentKeyExpiry < new Date()) {
      throw new BusinessLogicError(
        "Enrollment key has expired",
        ERROR_CODES.ENROLLMENT_KEY_EXPIRED
      );
    }

    // Check capacity
    const currentEnrollment = await this.countDocuments({
      class: classId,
      status: "active",
    }).session(session);

    if (currentEnrollment >= classDoc.maxStudents) {
      throw new BusinessLogicError(
        "Class is at maximum capacity",
        ERROR_CODES.CLASS_FULL
      );
    }

    // Prevent teacher self-enrollment
    if (classDoc.teacher.toString() === studentId.toString()) {
      throw new BusinessLogicError(
        "Teacher cannot enroll as student in their own class",
        ERROR_CODES.TEACHER_SELF_ENROLLMENT
      );
    }

    // Create enrollment
    const enrollment = new this({
      student: studentId,
      class: classId,
      enrollmentSource: enrollmentKey ? "enrollment_key" : "admin_add",
      createdBy: options.createdBy || studentId,
      statusHistory: [
        {
          status: "active",
          changedBy: studentId,
        },
      ],
    });

    console.log("reached");
    const savedEnrollment = await enrollment.save({ session });

    // ✅ Update student's enrolledClasses
    await mongoose.model("User").findByIdAndUpdate(
      studentId,
      {
        $push: {
          enrolledClasses: {
            classId,
            enrolledAt: new Date(),
            status: "active",
          },
        },
      },
      { session }
    );

    // ✅ Update class metrics
    await Class.findByIdAndUpdate(
      classId,
      {
        $inc: { "metrics.totalEnrollments": 1 },
        $set: { "metrics.lastCalculated": new Date() },
      },
      { session }
    );

    logger.info("Student enrolled successfully", {
      studentId,
      classId,
      enrollmentId: savedEnrollment._id,
      source: enrollment.enrollmentSource,
    });

    return savedEnrollment;
  } catch (error) {
    logger.error("Enrollment failed:", {
      studentId,
      classId,
      error: error.message,
    });
    throw error;
  }
};

classEnrollmentSchema.statics.dropStudent = async function (
  studentId,
  classId,
  reason = null,
  droppedBy = null,
  options = {}
) {
  const session = options.session || null;
  const Class = mongoose.model("Class");
  const User = mongoose.model("User");

  // ✅ 1. Find active enrollment
  const enrollment = await this.findOne({
    student: studentId,
    class: classId,
    status: "active",
  }).session(session);

  if (!enrollment) {
    throw new NotFoundError("Active enrollment not found");
  }

  // ✅ 2. Update enrollment status
  enrollment.status = "dropped";
  enrollment.droppedAt = new Date();

  if (reason) {
    if (enrollment.statusHistory.length > 0) {
      enrollment.statusHistory[enrollment.statusHistory.length - 1].reason =
        reason;
    } else {
      enrollment.statusHistory.push({
        status: "dropped",
        changedBy: droppedBy,
        reason,
      });
    }
  }

  await enrollment.save({ session });

  // ✅ 3. Update student's enrolledClasses (mark as dropped)
  await User.updateOne(
    {
      _id: studentId,
      "enrolledClasses.classId": classId,
    },
    {
      $set: {
        "enrolledClasses.$.status": "dropped",
      },
    },
    { session }
  );

  // ✅ 4. Update class metrics (decrement active enrollments, recalc lastCalculated)
  await Class.findByIdAndUpdate(
    classId,
    {
      $inc: { "metrics.totalEnrollments": -1 }, // 👈 Decrement
      $set: { "metrics.lastCalculated": new Date() },
    },
    { session }
  );

  return enrollment;
};

// Instance Methods
classEnrollmentSchema.methods.complete = async function (
  finalGrade,
  attendance = null
) {
  this.status = "completed";
  this.finalGrade = finalGrade;
  if (attendance !== null) this.attendance = attendance;

  return this.save();
};

// Export
const ClassEnrollment = mongoose.model(
  "ClassEnrollment",
  classEnrollmentSchema
);
module.exports = ClassEnrollment;
