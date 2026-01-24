// middleware/validation.js
const { body, validationResult } = require("express-validator");
const { ValidationError } = require("../utils/errors");

// Handle validation errors
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
// const handleValidationErrors = (req, res, next) => {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       message: "Validation failed",
//       errors: errors.array().map((err) => ({
//         field: err.path,
//         message: err.msg,
//         value: err.value,
//       })),
//     });
//   }
//   next();
// };

// Validation rules
const authValidation = {
  register: [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),

    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),

    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),

    body("password")
      .isLength({ min: 8 })
      .withMessage(" Password must be at least 8 characters"),

    body("role")
      .isIn(["student", "teacher"])
      .withMessage("Role must be either student or teacher"),

    body("studentId")
      .if(body("role").equals("student"))
      .notEmpty()
      .withMessage("Student ID is required for students"),

    body("employeeId")
      .if(body("role").equals("teacher"))
      .notEmpty()
      .withMessage("Employee ID is required for teachers"),

    body("department")
      .if(body("role").equals("teacher"))
      .notEmpty()
      .withMessage("Department is required for teachers"),

    handleValidationErrors,
  ],

  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("Password is required"),

    handleValidationErrors,
  ],
};

module.exports = {
  authValidation,
  handleValidationErrors,
};
