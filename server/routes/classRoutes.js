// routes/classRoutes.js - Complete Route Configuration
const express = require("express");
const router = express.Router();
const assignmentRoutes = require("./assignmentRoutes");
const {
  createClass,
  getMyClasses,
  updateClass,
  deleteClass,
  generateEnrollmentKey,
  getClassStudents,
  removeStudent,
  joinClass,
  getEnrolledClasses,
  leaveClass,
  getClassDetails,
} = require("../controllers/classController");

const { authenticate } = require("../middleware/auth");
const {
  isTeacher,
  isStudent,
  isClassTeacher,
  validateClassAccess,
} = require("../middleware/classAuth");
const { validateCreateClass } = require("../middleware/classValidation");

// Apply authentication to all routes
router.use(authenticate);

// Teacher Routes
router.post("/", isTeacher, validateCreateClass, createClass);
router.get("/my-classes", isTeacher, getMyClasses);
router.put("/:id", isClassTeacher, updateClass);
router.delete("/:id", isClassTeacher, deleteClass);
router.post("/:id/generate-key", isClassTeacher, generateEnrollmentKey);
router.get("/:id/students", validateClassAccess("teacher"), getClassStudents);
router.delete("/:id/students/:studentId", isClassTeacher, removeStudent);

// Student Routes
router.post("/join", isStudent, joinClass);
router.get("/enrolled", isStudent, getEnrolledClasses);
router.delete("/:id/leave", validateClassAccess("student"), leaveClass);

// Shared Routes
router.get("/:id", validateClassAccess("member"), getClassDetails);

// Mount assignments under a class
router.use("/:classId/assignments", assignmentRoutes);
module.exports = router;
