// models/Submission.js
const mongoose = require("mongoose");

const fileAttachmentSchema = new mongoose.Schema({
  originalFileName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment reference is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },

    // Simplified Content
    content: {
      type: String, // Can store text content, code, or description of files
    },

    // File attachments
    attachments: [fileAttachmentSchema],

    // Submission metadata
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "grading",
        "graded",
        "returned",
        "resubmitted",
      ],
      default: "draft",
    },

    // Submission tracking
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    ipAddress: String,
    userAgent: String,

    // Grading
    grade: {
      type: Number,
      min: 0,
    },
    finalGrade: {
      type: Number, // after penalties
      min: 0,
    },
    letterGrade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"],
    },

    // Feedback
    teacherFeedback: {
      type: String,
      maxlength: [5000, "Feedback cannot exceed 5000 characters"],
    },

    // Grading metadata
    gradedAt: Date,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Version control
    version: {
      type: Number,
      default: 1,
    },
    parentSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },

    // Flags
    flagged: {
      type: Boolean,
      default: false,
    },
    flaggedReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ student: 1, submittedAt: -1 });
submissionSchema.index({ gradedBy: 1, status: 1 });
submissionSchema.index({ assignment: 1, grade: -1 });

// Middleware
submissionSchema.pre("save", async function (next) {
  // Update lastModifiedAt on any change
  this.lastModifiedAt = new Date();

  // Check if submission is late
  if (this.isModified("submittedAt") && this.status === "submitted") {
    const assignment = await mongoose
      .model("Assignment")
      .findById(this.assignment);
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.isLate = true;
      this.latePenalty = assignment.calculateLatePenalty(this.submittedAt);
    }
  }

  // Calculate final grade with penalties
  if (this.isModified("grade") || this.isModified("latePenalty")) {
    if (this.grade !== undefined) {
      this.finalGrade = Math.max(
        0,
        this.grade - (this.grade * this.latePenalty) / 100
      );

      // Calculate letter grade
      this.letterGrade = this.calculateLetterGrade(this.finalGrade);
    }
  }

  // Increment version for resubmissions
  if (this.isModified("status") && this.status === "resubmitted") {
    this.version += 1;
  }

  next();
});

// Post save middleware to update assignment statistics
submissionSchema.post("save", async function (doc) {
  if (doc.isModified("grade") || doc.isModified("status")) {
    await doc.updateAssignmentStatistics();
  }
});

// Virtual fields
submissionSchema.virtual("isSubmitted").get(function () {
  return ["submitted", "grading", "graded", "returned", "resubmitted"].includes(
    this.status
  );
});

submissionSchema.virtual("isGraded").get(function () {
  return this.status === "graded" && this.grade !== undefined;
});

submissionSchema.virtual("passingGrade").get(function () {
  return this.finalGrade >= 60; // Assuming 60% is passing
});

// Methods
submissionSchema.methods.calculateLetterGrade = function (grade) {
  if (grade >= 97) return "A+";
  if (grade >= 93) return "A";
  if (grade >= 90) return "A-";
  if (grade >= 87) return "B+";
  if (grade >= 83) return "B";
  if (grade >= 80) return "B-";
  if (grade >= 77) return "C+";
  if (grade >= 73) return "C";
  if (grade >= 70) return "C-";
  if (grade >= 67) return "D+";
  if (grade >= 60) return "D";
  return "F";
};

submissionSchema.methods.canResubmit = async function () {
  const assignment = await mongoose
    .model("Assignment")
    .findById(this.assignment);
  if (!assignment) return false;

  return (
    this.attemptNumber < assignment.maxAttempts &&
    (assignment.allowLateSubmission || new Date() <= assignment.dueDate)
  );
};

submissionSchema.methods.updateAssignmentStatistics = async function () {
  const Assignment = mongoose.model("Assignment");
  const Submission = mongoose.model("Submission");

  try {
    const stats = await Submission.aggregate([
      { $match: { assignment: this.assignment, status: "graded" } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          averageGrade: { $avg: "$finalGrade" },
          totalEnrolled: { $addToSet: "$student" },
        },
      },
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      await Assignment.findByIdAndUpdate(this.assignment, {
        "statistics.totalSubmissions": stat.totalSubmissions,
        "statistics.averageGrade": Math.round(stat.averageGrade * 100) / 100,
        "statistics.completionRate": Math.round(
          (stat.totalSubmissions / stat.totalEnrolled.length) * 100
        ),
        "statistics.lastCalculated": new Date(),
      });
    }
  } catch (error) {
    console.error("Error updating assignment statistics:", error);
  }
};

// Static methods
submissionSchema.statics.getStudentSubmissions = function (
  studentId,
  assignmentId = null
) {
  const query = { student: studentId };
  if (assignmentId) query.assignment = assignmentId;

  return this.find(query)
    .populate("assignment", "title dueDate totalMarks type")
    .sort({ submittedAt: -1 });
};

submissionSchema.statics.getAssignmentSubmissions = function (
  assignmentId,
  status = null
) {
  const query = { assignment: assignmentId };
  if (status) query.status = status;

  return this.find(query)
    .populate("student", "fullName email studentId")
    .sort({ submittedAt: -1 });
};

submissionSchema.statics.getGradingQueue = function (teacherId) {
  return this.find({ status: "submitted" })
    .populate({
      path: "assignment",
      match: { teacher: teacherId },
      select: "title className dueDate totalMarks",
    })
    .populate("student", "fullName email studentId")
    .sort({ submittedAt: 1 });
};

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
