// models/Assignment.js
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Assignment description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    instructions: {
      type: String,
      maxlength: [5000, "Instructions cannot exceed 5000 characters"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher reference is required"],
    },
    type: {
      type: String,
      required: [true, "Assignment type is required"],
      // kept simple as requested
    },
    uploadedFiles: [
      {
        url: {
          type: String,
          required: true, // the stored file path or cloud URL
        },
        filename: String,
        originalName: String, // optional: keep the file's original name
        size: Number, // optional: file size in bytes
        mimeType: String, // optional: content type (pdf, png, etc.)
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Due date must be in the future",
      },
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
      max: [1000, "Total marks cannot exceed 1000"],
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    latePenaltyPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    timeLimit: {
      type: Number, // in minutes
      min: [1, "Time limit must be at least 1 minute"],
      max: [480, "Time limit cannot exceed 8 hours"],
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // File upload settings
    allowedFileTypes: [
      {
        type: String,
      },
    ],
    maxFileSize: {
      type: Number, // in MB
      default: 10,
      max: 100,
    },
    maxFiles: {
      type: Number,
      default: 5,
      max: 20,
    },

    // Statistics
    statistics: {
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      averageGrade: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      lastCalculated: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assignmentSchema.index({ class: 1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });
assignmentSchema.index({ dueDate: 1 });

// Middleware
assignmentSchema.pre("save", function (next) {
  // Set default file types if not provided
  if (!this.allowedFileTypes || this.allowedFileTypes.length === 0) {
    this.allowedFileTypes = ["pdf", "doc", "docx", "txt", "zip", "jpg", "jpeg", "png"];
  }
  next();
});

// Virtual for checking if assignment is overdue
assignmentSchema.virtual("isOverdue").get(function () {
  return new Date() > this.dueDate;
});

// Virtual for time remaining
assignmentSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();

  if (timeDiff <= 0) return "Overdue";

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (days > 0) return `${days} days, ${hours} hours`;
  return `${hours} hours`;
});

// Methods
assignmentSchema.methods.canSubmit = function () {
  if (this.isOverdue && !this.allowLateSubmission) return false;
  return true;
};

assignmentSchema.methods.calculateLatePenalty = function (submissionDate) {
  if (!this.allowLateSubmission || submissionDate <= this.dueDate) return 0;

  const hoursLate = Math.ceil(
    (submissionDate - this.dueDate) / (1000 * 60 * 60)
  );
  const daysLate = Math.ceil(hoursLate / 24);

  return Math.min(daysLate * this.latePenaltyPercentage, 100);
};

assignmentSchema.statics.getTeacherAssignments = function (
  teacherId,
  classId = null
) {
  const query = { teacher: teacherId };
  if (classId) query.class = classId;

  return this.find(query)
    .populate("class", "className classCode")
    .sort({ createdAt: -1 });
};

assignmentSchema.statics.getStudentAssignments = function (classIds) {
  return this.find({
    class: { $in: classIds },
  })
    .populate("class", "className classCode")
    .populate("teacher", "fullName email")
    .sort({ dueDate: 1 });
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
