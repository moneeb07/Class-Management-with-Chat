// controllers/submissionController.js
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const {
  AppError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require("../utils/errors");
const fs = require("fs").promises;
const path = require("path");
const archiver = require("archiver");
const ClassEnrollment = require("../models/ClassEnrollment");

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
exports.submitAssignment = asyncHandler(async (req, res, next) => {
  const { id: assignmentId } = req.params;
  const studentId = req.user.id;

  // 1. VALIDATE ASSIGNMENT EXISTS AND IS ACCESSIBLE
  const assignment = await Assignment.findById(assignmentId)
    .populate("class", "students teacher");

  if (!assignment) {
    return next(new NotFoundError("Assignment"));
  }

  // 2. VERIFY STUDENT IS ENROLLED IN THE CLASS
  const isEnrolled = await ClassEnrollment.findOne({
    class: assignment.class, // or assignment.classId, depending on schema
    student: studentId,
    status: "active",
  });

  if (!isEnrolled) {
    return next(new ForbiddenError("You are not enrolled in this class"));
  }

  // 3. CHECK ASSIGNMENT SUBMISSION STATUS
  if (!assignment.canSubmit()) {
    return next(
      new BadRequestError("Assignment cannot be submitted at this time")
    );
  }

  // 4. CHECK FOR EXISTING SUBMISSIONS
  let existingSubmission = await Submission.findOne({
    assignment: assignmentId,
    student: studentId,
  });

  // 5. VALIDATE ATTEMPT LIMITS
  if (existingSubmission && existingSubmission.status !== "draft") {
    if (existingSubmission.attemptNumber >= assignment.maxAttempts) {
      return next(new BadRequestError("Maximum submission attempts reached"));
    }
  }

  // 6. PREPARE SUBMISSION DATA
  const content = req.body.content || ""; // Simple content string/object

  const submissionData = {
    assignment: assignmentId,
    student: studentId,
    content: content,
    attachments: [],
    submittedAt: new Date(),
    status: "submitted",
    attemptNumber: existingSubmission
      ? existingSubmission.attemptNumber + 1
      : 1,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    version: existingSubmission ? existingSubmission.version + 1 : 1,
  };

  // 7. HANDLE FILE ATTACHMENTS
  if (req.files && req.files.length > 0) {
    const fileValidation = validateFiles(req.files, assignment);

    if (!fileValidation.isValid) {
      return next(new BadRequestError(fileValidation.message));
    }

    submissionData.attachments = req.files.map((file) => ({
      originalFileName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    }));
  }

  // 8. CHECK FOR LATE SUBMISSION
  if (new Date() > assignment.dueDate) {
    submissionData.isLate = true;
    submissionData.latePenalty = assignment.calculateLatePenalty(new Date());
  }

  // 9. CREATE OR UPDATE SUBMISSION
  let submission;
  if (existingSubmission) {
    // Store previous submission as parent for version tracking
    submissionData.parentSubmission = existingSubmission._id;
    Object.assign(existingSubmission, submissionData);
    submission = await existingSubmission.save();
  } else {
    submission = await Submission.create(submissionData);
  }

  // 10. UPDATE STUDENT STATISTICS
  await updateStudentStatistics(studentId, assignmentId);

  // 11. POPULATE AND RETURN RESPONSE
  await submission.populate([
    { path: "assignment", select: "title type totalMarks dueDate class" },
    { path: "student", select: "fullName email studentId" },
  ]);

  res.status(201).json({
    success: true,
    data: {
      submission,
      assignmentInfo: {
        id: assignment._id,
        title: assignment.title,
        type: assignment.type,
        className: assignment.class.name,
      },
    },
    message: "Assignment submitted successfully",
  });
});

// ===================
// HELPER FUNCTIONS
// ===================

function validateFiles(files, assignment) {
  // Check file count
  if (files.length > assignment.maxFiles) {
    return {
      isValid: false,
      message: `Maximum ${assignment.maxFiles} files allowed`,
    };
  }

  // Validate each file
  for (const file of files) {
    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);

    // Check file type
    if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && !assignment.allowedFileTypes.includes(fileExtension)) {
      return {
        isValid: false,
        message: `File type .${fileExtension} is not allowed. Allowed types: ${assignment.allowedFileTypes.join(
          ", "
        )}`,
      };
    }

    // Check file size
    if (file.size > assignment.maxFileSize * 1024 * 1024) {
      return {
        isValid: false,
        message: `File ${file.originalname} exceeds maximum size of ${assignment.maxFileSize}MB`,
      };
    }
  }

  return { isValid: true };
}

async function updateStudentStatistics(studentId, assignmentId) {
  try {
    await User.findByIdAndUpdate(studentId, {
      $inc: { totalSubmissions: 1 },
      $set: { lastSubmissionAt: new Date() },
    });
  } catch (error) {
    console.error("Error updating student statistics:", error);
  }
}

// @desc    Get submissions for an assignment (Teacher)
// @route   GET /api/assignments/:id/submissions
// @access  Private/Teacher
exports.getSubmissions = asyncHandler(async (req, res, next) => {
  const {
    status,
    sortBy = "submittedAt",
    order = "desc",
    page = 1,
    limit = 20,
  } = req.query;

  let filter = { assignment: req.params.id };
  if (status) filter.status = status;

  const sort = {};
  sort[sortBy] = order === "asc" ? 1 : -1;

  const submissions = await Submission.find(filter)
    .populate("student", "fullName email studentId")
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Submission.countDocuments(filter);

  res.json({
    success: true,
    count: submissions.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: submissions,
  });
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmissionById = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id)
    .populate("assignment", "title type totalMarks dueDate")
    .populate("student", "fullName email studentId")
    .populate("gradedBy", "fullName email");

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // Check access permissions
  if (
    req.user.role === "student" &&
    submission.student._id.toString() !== req.user.id
  ) {
    return next(new AppError("Not authorized to view this submission", 403));
  }

  res.json({
    success: true,
    data: submission,
  });
});

// @desc    Update submission (draft only)
// @route   PUT /api/submissions/:id
// @access  Private/Student
exports.updateSubmission = asyncHandler(async (req, res, next) => {
  let submission = await Submission.findById(req.params.id);

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // Check ownership
  if (submission.student.toString() !== req.user.id) {
    return next(new AppError("Not authorized to update this submission", 403));
  }

  // Only allow updates for draft submissions
  if (submission.status !== "draft") {
    return next(new AppError("Cannot update submitted assignment", 400));
  }

  const { content } = req.body;
  if (content) {
    submission.content = content; // Simplified content update
  }

  // Process new file attachments
  if (req.files && req.files.length > 0) {
    const assignment = await Assignment.findById(submission.assignment);
    
    // Validate new files
    const fileValidation = validateFiles(req.files, assignment);
    if (!fileValidation.isValid) {
        return next(new BadRequestError(fileValidation.message));
    }

    for (const file of req.files) {
      submission.attachments.push({
        originalFileName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }
  }

  submission = await submission.save();

  res.json({
    success: true,
    data: submission,
  });
});

// @desc    Delete submission (draft only)
// @route   DELETE /api/submissions/:id
// @access  Private/Student
exports.deleteSubmission = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // Check ownership
  if (submission.student.toString() !== req.user.id) {
    return next(new AppError("Not authorized to delete this submission", 403));
  }

  // Only allow deletion of draft submissions
  if (submission.status !== "draft") {
    return next(new AppError("Cannot delete submitted assignment", 400));
  }

  // Delete associated files
  for (const attachment of submission.attachments) {
    try {
      await fs.unlink(attachment.filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  await submission.deleteOne();

  res.json({
    success: true,
    message: "Submission deleted successfully",
  });
});

// @desc    Grade submission
// @route   POST /api/submissions/:id/grade
// @access  Private/Teacher
exports.gradeSubmission = asyncHandler(async (req, res, next) => {
  const { grade, feedback } = req.body;

  let submission = await Submission.findById(req.params.id);

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  const assignment = await Assignment.findById(submission.assignment);

  // Validate grade
  if (grade < 0 || grade > assignment.totalMarks) {
    return next(
      new AppError(`Grade must be between 0 and ${assignment.totalMarks}`, 400)
    );
  }

  submission.grade = grade;
  submission.teacherFeedback = feedback || "";
  submission.status = "graded";
  submission.gradedAt = new Date();
  submission.gradedBy = req.user.id;

  submission = await submission.save();

  // Populate response data
  await submission.populate("student", "fullName email studentId");
  await submission.populate("assignment", "title totalMarks");

  res.json({
    success: true,
    data: submission,
    message: "Submission graded successfully",
  });
});

// @desc    Get student's submissions
// @route   GET /api/submissions/my-submissions
// @access  Private/Student
exports.getStudentSubmissions = asyncHandler(async (req, res, next) => {
  const { status, assignmentType, page = 1, limit = 10 } = req.query;

  let filter = { student: req.user.id };
  if (status) filter.status = status;

  const submissions = await Submission.find(filter)
    .populate({
      path: "assignment",
      select: "title type totalMarks dueDate class",
      populate: {
        path: "class",
        select: "className classCode",
      },
      match: assignmentType ? { type: assignmentType } : {},
    })
    .sort({ submittedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Filter out submissions where assignment population failed
  const validSubmissions = submissions.filter((sub) => sub.assignment);

  const total = await Submission.countDocuments(filter);

  res.json({
    success: true,
    count: validSubmissions.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: validSubmissions,
  });
});

// @desc    Resubmit assignment
// @route   POST /api/submissions/:id/resubmit
// @access  Private/Student
exports.resubmitAssignment = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // Check ownership
  if (submission.student.toString() !== req.user.id) {
    return next(
      new AppError("Not authorized to resubmit this assignment", 403)
    );
  }

  // Check if resubmission is allowed
  const canResubmit = await submission.canResubmit();
  if (!canResubmit) {
    return next(new AppError("Resubmission not allowed", 400));
  }

  // Create new submission version
  const resubmissionData = {
    ...req.body,
    status: "resubmitted",
    submittedAt: new Date(),
    parentSubmission: submission._id,
    version: submission.version + 1,
    attemptNumber: submission.attemptNumber + 1,
  };

  // Process files if provided
  if (req.files && req.files.length > 0) {
    const assignment = await Assignment.findById(submission.assignment);

    // Validate files
     const fileValidation = validateFiles(req.files, assignment);
    if (!fileValidation.isValid) {
        return next(new BadRequestError(fileValidation.message));
    }

    resubmissionData.attachments = [];
    for (const file of req.files) {
      resubmissionData.attachments.push({
        originalFileName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }
  }

  Object.assign(submission, resubmissionData);
  await submission.save();

  res.json({
    success: true,
    data: submission,
    message: "Assignment resubmitted successfully",
  });
});

// @desc    Download submission files
// @route   GET /api/submissions/:id/download
// @access  Private
exports.downloadSubmission = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id)
    .populate("student", "fullName studentId")
    .populate("assignment", "title");

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  // Check access permissions
  if (
    req.user.role === "student" &&
    submission.student._id.toString() !== req.user.id
  ) {
    return next(
      new AppError("Not authorized to download this submission", 403)
    );
  }

  if (submission.attachments.length === 0) {
    return next(new AppError("No files to download", 400));
  }

  // If single file, send directly
  if (submission.attachments.length === 1) {
    const file = submission.attachments[0];
    const filePath = path.resolve(file.filePath);

    try {
      await fs.access(filePath);
      res.download(filePath, file.originalFileName);
    } catch (error) {
      return next(new AppError("File not found", 404));
    }
    return;
  }

  // Multiple files - create zip
  const archive = archiver("zip", { zlib: { level: 9 } });

  res.attachment(
    `${submission.student.fullName}_${submission.assignment.title}_submission.zip`
  );
  archive.pipe(res);

  submission.attachments.forEach((file) => {
    archive.file(file.filePath, { name: file.originalFileName });
  });

  archive.finalize();
});
