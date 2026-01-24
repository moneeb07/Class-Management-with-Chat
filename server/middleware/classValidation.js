// middleware/validation.js - Input Validation Middleware
const { body, param, query, validationResult } = require("express-validator");
const { CLASS_CONSTANTS } = require("../utils/constants");
const { ValidationError } = require("../utils/errors");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => `${error.path}: ${error.msg}`);

    return next(
      new ValidationError("Validation failed from middleware layer", {
        errors: errorMessages,
      })
    );
  }
  next();
};

const validateCreateClass = [
  body("className")
    .trim()
    .isLength({
      min: CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN,
      max: CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX,
    })
    .withMessage(
      `Class name must be ${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN}-${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX} characters`
    ),

  body("subject")
    .trim()
    .isLength({ min: 1, max: CLASS_CONSTANTS.LIMITS.SUBJECT_MAX })
    .withMessage(
      `Subject is required and must not exceed ${CLASS_CONSTANTS.LIMITS.SUBJECT_MAX} characters`
    ),

  body("semester")
    .isIn(CLASS_CONSTANTS.SEMESTERS)
    .withMessage(
      `Semester must be one of: ${CLASS_CONSTANTS.SEMESTERS.join(", ")}`
    ),

  body("academicYear")
    .matches(CLASS_CONSTANTS.PATTERNS.ACADEMIC_YEAR)
    .withMessage("Academic year must be in format YYYY-YYYY"),

  body("description")
    .optional()
    .isLength({ max: CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX })
    .withMessage(
      `Description cannot exceed ${CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX} characters`
    ),

  body("maxStudents")
    .optional()
    .isInt({
      min: CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN,
      max: CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX,
    })
    .withMessage(
      `Max students must be ${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN}-${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX}`
    ),

  handleValidationErrors,
];

const validateJoinClass = [
  body("enrollmentKey")
    .matches(CLASS_CONSTANTS.PATTERNS.ENROLLMENT_KEY)
    .withMessage("Enrollment key must be exactly 6 digits"),

  handleValidationErrors,
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid class ID"),

  handleValidationErrors,
];

module.exports = {
  validateCreateClass,
  validateJoinClass,
  validateObjectId,
  handleValidationErrors,
};
