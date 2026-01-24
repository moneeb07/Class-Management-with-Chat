// middleware/validation.js
const { body, param, query, validationResult } = require("express-validator");
const AppError = require("../utils/errors");
const path = require("path");

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.error("🚨 VALIDATION FAILED");
    console.error("📦 REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.error("❌ VALIDATION ERRORS:", errors.array());

    const errorMessages = errors
      .array()
      .map((error) => `${error.path}: ${error.msg}`);

    return next(
      new AppError.ValidationError(
        "Validation failed from middleware layer",
        { errors: errorMessages }
      )
    );
  }

  next();
};


// Assignment validation rules
exports.validateAssignment = [
  body("title")
    .notEmpty()
    .withMessage("Assignment title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters")
    .trim(),

  body("description")
    .notEmpty()
    .withMessage("Assignment description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters")
    .trim(),

  body("type")
    .notEmpty()
    .withMessage("Assignment type is required"),
    // Removed strict enum check for flexibility as requested for MVP

  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Invalid due date format")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),

  body("totalMarks")
    .notEmpty()
    .withMessage("Total marks is required")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Total marks must be between 1 and 1000"),

  body("timeLimit")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Time limit must be between 1 and 480 minutes"),

  body("maxAttempts")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Max attempts must be between 1 and 10"),

  body("maxFileSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Max file size must be between 1 and 100 MB"),

  body("maxFiles")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Max files must be between 1 and 20"),

  body("allowedFileTypes")
    .optional()
    .isArray()
    .withMessage("Allowed file types must be an array"),

  body("latePenaltyPercentage")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Late penalty must be between 0 and 100 percent"),

  handleValidationErrors,
];

// // Submission validation rules
// exports.validateSubmission = [
//   body("content").notEmpty().withMessage("Submission content is required"),

//   // Coding submission validation
//   body("content.code")
//     .if((value, { req }) => {
//       return req.assignment && req.assignment.type === "coding";
//     })
//     .notEmpty()
//     .withMessage("Code is required for coding assignments")
//     .isLength({ max: 50000 })
//     .withMessage("Code cannot exceed 50000 characters"),

//   body("content.language")
//     .if((value, { req }) => {
//       return req.assignment && req.assignment.type === "coding";
//     })
//     .optional()
//     .isIn([
//       "javascript",
//       "python",
//       "java",
//       "cpp",
//       "c",
//       "html-css",
//       "react",
//       "node",
//     ])
//     .withMessage("Invalid programming language"),

//   // Writing submission validation
//   body("content.text")
//     .if((value, { req }) => {
//       return req.assignment && req.assignment.type === "writing";
//     })
//     .notEmpty()
//     .withMessage("Text content is required for writing assignments")
//     .isLength({ max: 100000 })
//     .withMessage("Text content cannot exceed 100000 characters"),

//   // Project submission validation
//   body("content.projectDescription")
//     .if((value, { req }) => {
//       return req.assignment && req.assignment.type === "project";
//     })
//     .optional()
//     .isLength({ max: 5000 })
//     .withMessage("Project description cannot exceed 5000 characters"),

//   body("content.demoLink")
//     .optional()
//     .isURL()
//     .withMessage("Demo link must be a valid URL"),

//   body("content.repositoryLink")
//     .optional()
//     .isURL()
//     .withMessage("Repository link must be a valid URL"),

//   handleValidationErrors,
// ];

// Submission validation rules
exports.validateSubmission = [
  body("content")
    .optional()
    .custom((value) => {
      // Basic check, allow string or object, maybe just check if present if required
      return true;
    }),

  handleValidationErrors,
];

// // Grading validation rules
// exports.validateGrading = [
//   body("grade")
//     .notEmpty()
//     .withMessage("Grade is required")
//     .isNumeric()
//     .withMessage("Grade must be a number")
//     .custom((value, { req }) => {
//       if (value < 0) {
//         throw new Error("Grade cannot be negative");
//       }
//       // Note: Upper limit validation happens in controller with assignment context
//       return true;
//     }),

//   body("feedback")
//     .optional()
//     .isLength({ max: 5000 })
//     .withMessage("Feedback cannot exceed 5000 characters")
//     .trim(),

//   body("rubricGrades")
//     .optional()
//     .isArray()
//     .withMessage("Rubric grades must be an array"),

//   body("rubricGrades.*.criteriaName")
//     .optional()
//     .notEmpty()
//     .withMessage("Criteria name is required"),

//   body("rubricGrades.*.maxPoints")
//     .optional()
//     .isNumeric()
//     .withMessage("Max points must be a number"),

//   body("rubricGrades.*.earnedPoints")
//     .optional()
//     .isNumeric()
//     .withMessage("Earned points must be a number")
//     .custom((value, { req }) => {
//       if (value < 0) {
//         throw new Error("Earned points cannot be negative");
//       }
//       return true;
//     }),

//   handleValidationErrors,
// ];

// // Bulk grading validation
// exports.validateBulkGrading = [
//   body("grades")
//     .notEmpty()
//     .withMessage("Grades array is required")
//     .isArray({ min: 1 })
//     .withMessage("Grades must be a non-empty array"),

//   body("grades.*.submissionId")
//     .notEmpty()
//     .withMessage("Submission ID is required")
//     .isMongoId()
//     .withMessage("Invalid submission ID format"),

//   body("grades.*.grade")
//     .notEmpty()
//     .withMessage("Grade is required")
//     .isNumeric()
//     .withMessage("Grade must be a number")
//     .custom((value) => {
//       if (value < 0) {
//         throw new Error("Grade cannot be negative");
//       }
//       return true;
//     }),

//   body("grades.*.feedback")
//     .optional()
//     .isLength({ max: 5000 })
//     .withMessage("Feedback cannot exceed 5000 characters")
//     .trim(),

//   handleValidationErrors,
// ];

// // ID parameter validation
// exports.validateObjectId = (paramName = "id") => [
//   param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
//   handleValidationErrors,
// ];

// // Query parameter validation for lists
// exports.validateListQuery = [
//   query("page")
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage("Page must be a positive integer"),

//   query("limit")
//     .optional()
//     .isInt({ min: 1, max: 100 })
//     .withMessage("Limit must be between 1 and 100"),

//   query("sortBy")
//     .optional()
//     .isIn([
//       "createdAt",
//       "updatedAt",
//       "dueDate",
//       "title",
//       "submittedAt",
//       "grade",
//     ])
//     .withMessage("Invalid sort field"),

//   query("order")
//     .optional()
//     .isIn(["asc", "desc"])
//     .withMessage("Order must be asc or desc"),

//   query("status")
//     .optional()
//     .isIn([
//       "draft",
//       "published",
//       "submitted",
//       "grading",
//       "graded",
//       "returned",
//       "resubmitted",
//     ])
//     .withMessage("Invalid status filter"),

//   query("type")
//     .optional()
//     .isIn([
//       "coding",
//       "writing",
//       "drawing",
//       "system-design",
//       "project",
//       "quiz",
//       "lab",
//     ])
//     .withMessage("Invalid type filter"),

//   handleValidationErrors,
// ];

// // File upload validation
// exports.validateFileUpload = (req, res, next) => {
//   // This runs after multer middleware
//   if (req.fileValidationError) {
//     return next(new AppError(req.fileValidationError, 400));
//   }

//   // Additional file validation can be added here
//   if (req.files && req.files.length > 0) {
//     const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
//     const maxTotalSize = 500 * 1024 * 1024; // 500MB total

//     if (totalSize > maxTotalSize) {
//       return next(new AppError("Total file size exceeds 500MB limit", 400));
//     }

//     // Check for malicious file names
//     const dangerousPatterns = [/\.\./g, /[<>:"/\\|?*]/g];
//     for (const file of req.files) {
//       for (const pattern of dangerousPatterns) {
//         if (pattern.test(file.originalname)) {
//           return next(new AppError("Invalid file name detected", 400));
//         }
//       }
//     }
//   }

//   next();
// };

// // Custom validation for assignment type-specific data
// exports.validateAssignmentTypeData = (req, res, next) => {
//   const { type } = req.body;

//   switch (type) {
//     case "coding":
//       if (req.body.codingSettings) {
//         const { testCases } = req.body.codingSettings;

//         // Validate test cases structure
//         if (testCases && testCases.length > 0) {
//           for (let i = 0; i < testCases.length; i++) {
//             const testCase = testCases[i];
//             if (!testCase.input || !testCase.expectedOutput) {
//               return next(
//                 new AppError(
//                   `Test case ${i + 1} must have both input and expected output`,
//                   400
//                 )
//               );
//             }

//             if (
//               testCase.points &&
//               (testCase.points < 1 || testCase.points > 100)
//             ) {
//               return next(
//                 new AppError(
//                   `Test case ${i + 1} points must be between 1 and 100`,
//                   400
//                 )
//               );
//             }
//           }
//         }
//       }
//       break;

//     case "writing":
//       if (req.body.writingSettings) {
//         const { topics, wordLimit } = req.body.writingSettings;

//         if (topics && (!Array.isArray(topics) || topics.length === 0)) {
//           return next(
//             new AppError("Writing topics must be a non-empty array", 400)
//           );
//         }

//         if (wordLimit && (wordLimit < 50 || wordLimit > 10000)) {
//           return next(
//             new AppError("Word limit must be between 50 and 10000", 400)
//           );
//         }
//       }
//       break;

//     case "project":
//       if (req.body.projectSettings) {
//         const { vivaQuestions, milestones } = req.body.projectSettings;

//         // Validate viva questions
//         if (vivaQuestions && Array.isArray(vivaQuestions)) {
//           for (let i = 0; i < vivaQuestions.length; i++) {
//             const question = vivaQuestions[i];
//             if (!question.question || question.question.trim().length === 0) {
//               return next(
//                 new AppError(`Viva question ${i + 1} cannot be empty`, 400)
//               );
//             }

//             if (
//               question.points &&
//               (question.points < 1 || question.points > 50)
//             ) {
//               return next(
//                 new AppError(
//                   `Viva question ${i + 1} points must be between 1 and 50`,
//                   400
//                 )
//               );
//             }
//           }
//         }

//         // Validate milestones
//         if (milestones && Array.isArray(milestones)) {
//           for (let i = 0; i < milestones.length; i++) {
//             const milestone = milestones[i];
//             if (!milestone.title || !milestone.dueDate) {
//               return next(
//                 new AppError(
//                   `Milestone ${i + 1} must have title and due date`,
//                   400
//                 )
//               );
//             }

//             if (new Date(milestone.dueDate) <= new Date()) {
//               return next(
//                 new AppError(
//                   `Milestone ${i + 1} due date must be in the future`,
//                   400
//                 )
//               );
//             }
//           }
//         }
//       }
//       break;

//     case "system-design":
//       if (req.body.systemDesignSettings) {
//         const { evaluationCriteria, requiredComponents } =
//           req.body.systemDesignSettings;

//         if (evaluationCriteria) {
//           const criteria = [
//             "scalability",
//             "reliability",
//             "security",
//             "performance",
//           ];
//           for (const criterion of criteria) {
//             if (evaluationCriteria[criterion] !== undefined) {
//               const value = evaluationCriteria[criterion];
//               if (value < 0 || value > 100) {
//                 return next(
//                   new AppError(
//                     `${criterion} evaluation criteria must be between 0 and 100`,
//                     400
//                   )
//                 );
//               }
//             }
//           }
//         }

//         if (requiredComponents && !Array.isArray(requiredComponents)) {
//           return next(
//             new AppError("Required components must be an array", 400)
//           );
//         }
//       }
//       break;
//   }

//   next();
// };

// // Validate rubric weightage totals 100%
// exports.validateRubricWeightage = (req, res, next) => {
//   const { rubric } = req.body;

//   if (rubric && rubric.length > 0) {
//     const totalWeightage = rubric.reduce((sum, criteria) => {
//       return sum + (parseFloat(criteria.weightage) || 0);
//     }, 0);

//     if (Math.abs(totalWeightage - 100) > 0.01) {
//       return next(
//         new AppError("Rubric criteria weightage must total exactly 100%", 400)
//       );
//     }
//   }

//   next();
// };

// // Validate submission content based on assignment type
// exports.validateSubmissionContent = async (req, res, next) => {
//   try {
//     // Get assignment details if not already attached
//     if (!req.assignment) {
//       const Assignment = require("../models/Assignment");
//       req.assignment = await Assignment.findById(
//         req.params.id || req.body.assignmentId
//       );
//     }

//     if (!req.assignment) {
//       return next(new AppError("Assignment not found", 404));
//     }

//     const { content } = req.body;
//     const { type } = req.assignment;

//     switch (type) {
//       case "coding":
//         if (!content.code || content.code.trim().length === 0) {
//           return next(
//             new AppError("Code cannot be empty for coding assignments", 400)
//           );
//         }

//         // Validate programming language
//         if (
//           content.language &&
//           req.assignment.codingSettings.programmingLanguage
//         ) {
//           if (
//             content.language !==
//             req.assignment.codingSettings.programmingLanguage
//           ) {
//             return next(
//               new AppError(
//                 `Code must be in ${req.assignment.codingSettings.programmingLanguage}`,
//                 400
//               )
//             );
//           }
//         }
//         break;

//       case "writing": {
//         if (!content.text || content.text.trim().length === 0) {
//           return next(
//             new AppError(
//               "Text content cannot be empty for writing assignments",
//               400
//             )
//           );
//         }

//         // Check word limit
//         const wordCount = content.text.trim().split(/\s+/).length;
//         if (
//           req.assignment.writingSettings.wordLimit &&
//           wordCount > req.assignment.writingSettings.wordLimit
//         ) {
//           return next(
//             new AppError(
//               `Text exceeds word limit of ${req.assignment.writingSettings.wordLimit} words`,
//               400
//             )
//           );
//         }
//         break;
//       }

//       case "project":
//         // Project submissions are more flexible, but validate required fields
//         if (
//           req.assignment.projectSettings.submissionFormat !== "code" &&
//           !content.projectDescription
//         ) {
//           return next(new AppError("Project description is required", 400));
//         }

//         // Validate URLs if provided
//         if (content.demoLink && !isValidURL(content.demoLink)) {
//           return next(new AppError("Invalid demo link URL", 400));
//         }

//         if (content.repositoryLink && !isValidURL(content.repositoryLink)) {
//           return next(new AppError("Invalid repository link URL", 400));
//         }
//         break;

//       case "system-design":
//         if (
//           !content.designDocument ||
//           content.designDocument.trim().length === 0
//         ) {
//           return next(
//             new AppError(
//               "Design document is required for system design assignments",
//               400
//             )
//           );
//         }
//         break;
//     }

//     next();
//   } catch (error) {
//     next(new AppError("Error validating submission content", 500));
//   }
// };

// // Helper function to validate URLs
// function isValidURL(string) {
//   try {
//     new URL(string);
//     return true;
//   } catch (_) {
//     return false;
//   }
// }

// // Validate file types against assignment requirements
// exports.validateSubmissionFiles = (req, res, next) => {
//   if (!req.files || req.files.length === 0) {
//     return next();
//   }

//   // This validation will be enhanced with assignment-specific rules in the controller
//   // Here we do basic validation
//   const maxFileSize = 100 * 1024 * 1024; // 100MB
//   const maxFiles = 20;

//   if (req.files.length > maxFiles) {
//     return next(new AppError(`Maximum ${maxFiles} files allowed`, 400));
//   }

//   for (const file of req.files) {
//     if (file.size > maxFileSize) {
//       return next(
//         new AppError(`File ${file.originalname} exceeds 100MB limit`, 400)
//       );
//     }

//     // Check for empty files
//     if (file.size === 0) {
//       return next(new AppError(`File ${file.originalname} is empty`, 400));
//     }

//     // Basic security check for file extensions
//     const extension = path.extname(file.originalname).toLowerCase();
//     const dangerousExtensions = [
//       ".exe",
//       ".bat",
//       ".cmd",
//       ".scr",
//       ".pif",
//       ".com",
//       ".jar",
//     ];

//     if (dangerousExtensions.includes(extension)) {
//       return next(
//         new AppError(
//           `File type ${extension} is not allowed for security reasons`,
//           400
//         )
//       );
//     }
//   }

//   next();
// };

module.exports = exports;
