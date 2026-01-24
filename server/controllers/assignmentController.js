// controllers/assignmentController.js
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Class = require("../models/Class");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  BusinessLogicError,
  ServerError,
} = require("../utils/errors");
const path = require("path");
const fs = require("fs");

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
exports.createAssignment = asyncHandler(async (req, res, next) => {
  const { classId } = req.params;
  const {
    title,
    description,
    instructions,
    type,
    dueDate,
    totalMarks,
    timeLimit,
    maxAttempts,
    allowedFileTypes,
    maxFileSize,
    maxFiles,
    allowLateSubmission,
    latePenaltyPercentage,
  } = req.body;

  // Verify teacher owns the class
  const classInfo = await Class.findById(classId);
  if (!classInfo) {
    return next(new NotFoundError("Class"));
  }

  if (classInfo.teacher.toString() !== req.user.id) {
    return next(
      new ForbiddenError("Not authorized to create assignments for this class")
    );
  }

  // Create assignment object
  const assignmentData = {
    title,
    description,
    instructions,
    class: classId,
    teacher: req.user.id,
    type,
    dueDate: new Date(dueDate),
    totalMarks,
    allowLateSubmission: allowLateSubmission || false,
    latePenaltyPercentage: latePenaltyPercentage || 10,
  };

  // Add optional fields
  if (timeLimit) assignmentData.timeLimit = timeLimit;
  if (maxAttempts) assignmentData.maxAttempts = maxAttempts;
  if (allowedFileTypes) assignmentData.allowedFileTypes = allowedFileTypes;
  if (maxFileSize) assignmentData.maxFileSize = maxFileSize;
  if (maxFiles) assignmentData.maxFiles = maxFiles;

  // Handle uploaded file
  if (req.file) {
    assignmentData.uploadedFiles = [
      {
        url: `../uploads/assignments/${req.file.filename}`, // relative path for serving
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    ];
  }

  const assignment = await Assignment.create(assignmentData);
  // Increment teacher's totalAssignments count
  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { totalAssignments: 1 } },
    { new: true }
  );

  res.status(201).json({
    success: true,
    data: assignment,
  });
});

// @desc    Download assignment .zip file
// @route   GET /api/classes/:classId/assignments/:assignmentId/download?filename=<filename>
// @access  Private
exports.downloadAssignmentZip = asyncHandler(async (req, res, next) => {
  const { assignmentId } = req.params;
  const { filename } = req.query;

  if (!filename) {
    return next(new ValidationError("Filename is required for download"));
  }

  // Construct absolute file path
  const filePath = path.join(__dirname, "../uploads/assignments", filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return next(new NotFoundError("Assignment file"));
  }

  try {
    // ✅ Set headers for file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=assignment_${assignmentId}.zip`
    );
    res.setHeader("Content-Type", "application/zip");

    // ✅ Stream file (best for scalability)
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      console.error("Error streaming file:", err);
      return next(new ServerError("Error streaming assignment file"));
    });
  } catch (error) {
    console.error("❌ Error downloading file:", error);
    return next(new ServerError("Error downloading assignment"));
  }
});

// @desc    Get assignments (filtered by role)
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = asyncHandler(async (req, res, next) => {
  const { classId } = req.params;
  const { type, page = 1, limit = 10 } = req.query;

  if (!classId) {
    return next(new ValidationError("classId is required"));
  }

  let filter = { class: classId };

  if (req.user.role === "teacher") {
    // Verify teacher owns the class (optional check, but good for security)
    const classInfo = await Class.findById(classId);
    if (classInfo && classInfo.teacher.toString() !== req.user.id) {
        // Allow fallback or strict check? Usually strict.
    }
  } else if (req.user.role === "student") {
     // Verify student is enrolled in this class
    const isEnrolled = req.user.enrolledClasses.some(
      (enrolled) =>
        enrolled.classId.toString() === classId.toString() &&
        enrolled.status === "active"
    );

    if (!isEnrolled) {
      return next(new ForbiddenError("You are not enrolled in this class"));
    }
  }

  // Apply optional filters
  if (type) filter.type = type;

  const assignments = await Assignment.find(filter)
    .populate("class", "className classCode")
    .populate("teacher", "fullName email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Assignment.countDocuments(filter);

  // For students, attach submission status
  if (req.user.role === "student") {
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user.id,
    }).select("assignment status grade submittedAt");

    assignments.forEach((assignment) => {
      const submission = submissions.find(
        (s) => s.assignment.toString() === assignment._id.toString()
      );
      assignment._doc.submissionStatus = submission
        ? submission.status
        : "not_started";
      assignment._doc.submissionGrade = submission ? submission.grade : null;
      assignment._doc.submittedAt = submission ? submission.submittedAt : null;
    });
  }

  res.json({
    success: true,
    count: assignments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: assignments,
  });
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = asyncHandler(async (req, res, next) => {
  try {
    // Validate assignment ID format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new ValidationError("Invalid assignment ID format"));
    }

    // Find assignment with populated fields
    const assignment = await Assignment.findById(req.params.id)
      .populate("class", "className classCode")
      .populate("teacher", "firstName lastName fullName email")
      .lean();

    if (!assignment) {
      return next(new NotFoundError("Assignment not found"));
    }

    // Create response object
    const responseData = {
      ...assignment,
    };

    // Handle student-specific data
    if (req.user.role === "student") {
      try {
        const submission = await Submission.findOne({
          assignment: req.params.id,
          student: req.user.id,
        }).lean();

        responseData.userSubmission = submission || null;
        
        // Re-instantiate document to use virtuals/methods if needed, or implement manually
        const assignmentDoc = await Assignment.findById(req.params.id);
        responseData.canSubmit = assignmentDoc ? assignmentDoc.canSubmit() : false;
        responseData.timeRemaining = assignmentDoc ? assignmentDoc.timeRemaining : 0;
        responseData.isOverdue = assignmentDoc ? assignmentDoc.isOverdue : true;

      } catch (submissionError) {
        // Provide safe defaults
        responseData.userSubmission = null;
        responseData.canSubmit = false;
        responseData.timeRemaining = 0;
        responseData.isOverdue = true;
      }
    }

    // Handle teacher-specific data
    if (req.user.role === "teacher") {
      try {
        const submissionStats = await Submission.aggregate([
          { $match: { assignment: assignment._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const stats = {
          total: 0,
          submitted: 0,
          graded: 0,
          draft: 0,
        };

        if (submissionStats && submissionStats.length > 0) {
          submissionStats.forEach((stat) => {
            if (stat._id && typeof stats[stat._id] !== "undefined") {
              stats[stat._id] = stat.count || 0;
              stats.total += stat.count || 0;
            }
          });
        }
        responseData.submissionStats = stats;
      } catch (statsError) {
        responseData.submissionStats = { total: 0, submitted: 0, graded: 0, draft: 0 };
      }
    }

    res.status(200).json({
      success: true,
      data: responseData,
      message: "Assignment retrieved successfully",
    });
  } catch (error) {
    return next(new AppError("Failed to retrieve assignment", 500));
  }
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Teacher
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  let assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  // Check ownership
  if (assignment.teacher.toString() !== req.user.id) {
      return next(new ForbiddenError("Not authorized to update this assignment"));
  }

  // Simple update without complex checks
  assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: assignment,
  });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return next(new NotFoundError("Assignment"));
  }

  // Check ownership
  if (assignment.teacher.toString() !== req.user.id) {
      return next(new ForbiddenError("Not authorized to delete this assignment"));
  }

  // Check if assignment has submissions
  const submissionCount = await Submission.countDocuments({
    assignment: req.params.id,
  });

  if (submissionCount > 0) {
    return next(
      new BusinessLogicError(
        "Cannot delete assignment with existing submissions",
        "ASSIGNMENT_HAS_SUBMISSIONS"
      )
    );
  }

  await assignment.deleteOne();

  await User.findByIdAndUpdate(
    assignment.teacher,
    { $inc: { totalAssignments: -1 } },
    { new: true }
  );

  res.json({
    success: true,
    message: "Assignment deleted successfully",
  });
});

// @desc    Get assignment statistics
// @route   GET /api/assignments/:id/statistics
// @access  Private/Teacher
exports.getAssignmentStatistics = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  const submissions = await Submission.find({ assignment: req.params.id });

  const stats = {
    totalSubmissions: submissions.length,
    submittedCount: submissions.filter(
      (s) => s.status === "submitted" || s.status === "graded"
    ).length,
    gradedCount: submissions.filter((s) => s.status === "graded").length,
    lateSubmissions: submissions.filter((s) => s.isLate).length,
    averageGrade: 0,
    gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
  };

  const gradedSubmissions = submissions.filter((s) => s.grade !== undefined);

  if (gradedSubmissions.length > 0) {
    stats.averageGrade =
      gradedSubmissions.reduce((sum, s) => sum + s.finalGrade, 0) /
      gradedSubmissions.length;

    gradedSubmissions.forEach((submission) => {
      if (submission.finalGrade >= 90) stats.gradeDistribution.A++;
      else if (submission.finalGrade >= 80) stats.gradeDistribution.B++;
      else if (submission.finalGrade >= 70) stats.gradeDistribution.C++;
      else if (submission.finalGrade >= 60) stats.gradeDistribution.D++;
      else stats.gradeDistribution.F++;
    });
  }

  res.json({
    success: true,
    data: stats,
  });
});

// @desc    Export assignment data
// @route   GET /api/assignments/:id/export
// @access  Private/Teacher
exports.exportAssignmentData = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id).populate(
    "class",
    "className classCode"
  );

  if (!assignment) {
    return next(new AppError("Assignment not found", 404));
  }

  const submissions = await Submission.find({ assignment: req.params.id })
    .populate("student", "fullName email studentId")
    .sort({ submittedAt: -1 });

  const exportData = {
    assignment: {
      title: assignment.title,
      type: assignment.type,
      totalMarks: assignment.totalMarks,
      dueDate: assignment.dueDate,
      className: assignment.class.className,
      classCode: assignment.class.classCode,
    },
    submissions: submissions.map((submission) => ({
      studentName: submission.student.fullName,
      studentEmail: submission.student.email,
      studentId: submission.student.studentId,
      submittedAt: submission.submittedAt,
      status: submission.status,
      grade: submission.grade,
      finalGrade: submission.finalGrade,
      letterGrade: submission.letterGrade,
      isLate: submission.isLate,
      latePenalty: submission.latePenalty,
      attemptNumber: submission.attemptNumber,
      timeSpent: submission.timeSpent,
    })),
  };

  res.json({
    success: true,
    data: exportData,
  });
});

