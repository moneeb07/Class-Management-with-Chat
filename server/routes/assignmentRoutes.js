// routes/assignmentRoutes.js
const router = require("express").Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  downloadAssignmentZip,
  publishAssignment,
  duplicateAssignment,
  getAssignmentStatistics,
  exportAssignmentData,
  bulkGradeAssignments,
} = require("../controllers/assignmentController");

const {
  submitAssignment,
  getSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  gradeSubmission,
  getStudentSubmissions,
  resubmitAssignment,
  downloadSubmission,
  bulkDownloadSubmissions,
  runCodeSubmission,
  checkPlagiarism,
} = require("../controllers/submissionController");

const { authenticate, authorize } = require("../middleware/auth");
const {
  validateAssignment,
  validateSubmission,
} = require("../middleware/validation");
const { isClassMember, isClassTeacher } = require("../middleware/classAuth");

// Models (used in inline routes)
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { log } = require("console");

// ===================
// MULTER SETUP
// ===================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/assignments");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "pdf",
    "doc",
    "docx",
    "txt",
    "jpg",
    "jpeg",
    "png",
    "zip",
    "cpp",
    "java",
    "py",
    "js",
    "html",
    "css",
    "json",
  ];
  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 20,
  },
  fileFilter,
});

// ===================
// ASSIGNMENT ROUTES
// ===================
router.post(
  "/",
  authenticate,
  authorize("teacher"),
  upload.single("questionFile"), // <-- parse file + text fields
  validateAssignment,
  createAssignment
);

router.get("/", authenticate, getAssignments);

router.get("/:id", authenticate, isClassMember, getAssignmentById);
router.put(
  "/:id",
  authenticate,
  authorize("teacher"),
  isClassTeacher,
  // validateAssignment,
  updateAssignment
);

router.delete(
  "/:id",
  authenticate,
  authorize("teacher"),
  isClassTeacher,
  deleteAssignment
);

// router.patch(
//   "/assignments/:id/publish",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   publishAssignment
// );

// router.post(
//   "/assignments/:id/duplicate",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   duplicateAssignment
// );

// router.get(
//   "/assignments/:id/statistics",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   getAssignmentStatistics
// );

// router.get(
//   "/assignments/:id/export",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   exportAssignmentData
// );

// router.post(
//   "/assignments/:id/bulk-grade",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   bulkGradeAssignments
// );

// download file
// ✅ Download assignment .zip file (industry-standard, streaming)
router.get(
  "/:assignmentId/download",
  authenticate,
  isClassMember,
  downloadAssignmentZip
);
// // ===================
// // SUBMISSION ROUTES
// // ===================
router.post(
  "/:id/submit",
  authenticate,
  authorize("student"),
  isClassMember,
  upload.array("files", 20),
  validateSubmission,
  submitAssignment
);

// router.get(
//   "/submissions/my-submissions",
//   protect,
//   authorize("student"),
//   getStudentSubmissions
// );

// router.get("/submissions/:id", protect, getSubmissionById);

// router.put(
//   "/submissions/:id",
//   protect,
//   authorize("student"),
//   upload.array("files", 20),
//   validateSubmission,
//   updateSubmission
// );

// router.delete(
//   "/submissions/:id",
//   protect,
//   authorize("student"),
//   deleteSubmission
// );

// router.post(
//   "/submissions/:id/resubmit",
//   protect,
//   authorize("student"),
//   upload.array("files", 20),
//   validateSubmission,
//   resubmitAssignment
// );

// // Teacher – Manage Submissions
// Teacher – Manage Submissions
router.get(
  "/:id/submissions",
  authenticate,
  authorize("teacher"),
  isClassTeacher,
  getSubmissions
);

// router.post(
//   "/submissions/:id/grade",
//   protect,
//   authorize("teacher"),
//   gradeSubmission
// );

// router.get("/submissions/:id/download", protect, downloadSubmission);

// router.get(
//   "/assignments/:id/submissions/download-all",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   bulkDownloadSubmissions
// );

// // Coding Submission
// router.post("/submissions/:id/run-code", protect, runCodeSubmission);

// // Plagiarism Check
// router.post(
//   "/assignments/:id/check-plagiarism",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   checkPlagiarism
// );

// // ===================
// // FILE UPLOAD ROUTES
// // ===================
// router.post(
//   "/assignments/:id/upload-instructions",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   upload.single("instructionFile"),
//   async (req, res) => {
//     try {
//       const assignment = await Assignment.findById(req.params.id);
//       if (!assignment) {
//         return res.status(404).json({ message: "Assignment not found" });
//       }

//       if (req.file) {
//         assignment.instructionFiles = assignment.instructionFiles || [];
//         assignment.instructionFiles.push({
//           originalName: req.file.originalname,
//           filename: req.file.filename,
//           path: req.file.path,
//           size: req.file.size,
//           mimeType: req.file.mimetype,
//         });

//         await assignment.save();
//       }

//       res.json({
//         message: "Instruction file uploaded successfully",
//         file: req.file
//           ? {
//               name: req.file.originalname,
//               size: req.file.size,
//             }
//           : null,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// router.post(
//   "/assignments/:id/upload-rubric",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   upload.single("rubricFile"),
//   async (req, res) => {
//     try {
//       const assignment = await Assignment.findById(req.params.id);
//       if (!assignment) {
//         return res.status(404).json({ message: "Assignment not found" });
//       }

//       if (req.file) {
//         assignment.rubricFile = {
//           originalName: req.file.originalname,
//           filename: req.file.filename,
//           path: req.file.path,
//           size: req.file.size,
//           mimeType: req.file.mimetype,
//         };

//         await assignment.save();
//       }

//       res.json({
//         message: "Rubric file uploaded successfully",
//         file: req.file
//           ? {
//               name: req.file.originalname,
//               size: req.file.size,
//             }
//           : null,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // ===================
// // ASSIGNMENT TYPE SPECIFIC
// // ===================

// // Coding Assignments
// router.post(
//   "/assignments/:id/test-cases",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   async (req, res) => {
//     try {
//       const { testCases } = req.body;
//       const assignment = await Assignment.findById(req.params.id);

//       if (!assignment || assignment.type !== "coding") {
//         return res
//           .status(400)
//           .json({ message: "Invalid assignment for test cases" });
//       }

//       assignment.codingSettings.testCases = testCases;
//       await assignment.save();

//       res.json({ message: "Test cases updated successfully" });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // Project Assignments
// router.post(
//   "/assignments/:id/viva-questions",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   async (req, res) => {
//     try {
//       const { vivaQuestions } = req.body;
//       const assignment = await Assignment.findById(req.params.id);

//       if (!assignment || assignment.type !== "project") {
//         return res
//           .status(400)
//           .json({ message: "Invalid assignment for viva questions" });
//       }

//       assignment.projectSettings.vivaQuestions = vivaQuestions;
//       await assignment.save();

//       res.json({ message: "Viva questions updated successfully" });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // ===================
// // ANALYTICS & REPORTING
// // ===================
// router.get(
//   "/assignments/:id/analytics",
//   protect,
//   authorize("teacher"),
//   isTeacherOfClass,
//   async (req, res) => {
//     try {
//       const assignment = await Assignment.findById(req.params.id);
//       const submissions = await Submission.find({
//         assignment: req.params.id,
//         status: "graded",
//       });

//       const analytics = {
//         totalSubmissions: submissions.length,
//         averageGrade:
//           submissions.reduce((sum, sub) => sum + sub.finalGrade, 0) /
//             submissions.length || 0,
//         gradeDistribution: {
//           A: submissions.filter((s) => s.finalGrade >= 90).length,
//           B: submissions.filter((s) => s.finalGrade >= 80 && s.finalGrade < 90)
//             .length,
//           C: submissions.filter((s) => s.finalGrade >= 70 && s.finalGrade < 80)
//             .length,
//           D: submissions.filter((s) => s.finalGrade >= 60 && s.finalGrade < 70)
//             .length,
//           F: submissions.filter((s) => s.finalGrade < 60).length,
//         },
//         lateSubmissions: submissions.filter((s) => s.isLate).length,
//         onTimeSubmissions: submissions.filter((s) => !s.isLate).length,
//         plagiarismCases: submissions.filter((s) => s.plagiarismDetected).length,
//       };

//       res.json({ analytics });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // ===================
// // MULTER ERROR HANDLER
// // ===================
// router.use((error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res
//         .status(400)
//         .json({ message: "File too large. Maximum size is 100MB." });
//     }
//     if (error.code === "LIMIT_FILE_COUNT") {
//       return res
//         .status(400)
//         .json({ message: "Too many files. Maximum is 20 files." });
//     }
//   }
//   if (error.message.includes("File type")) {
//     return res.status(400).json({ message: error.message });
//   }
//   next(error);
// });

module.exports = router;
