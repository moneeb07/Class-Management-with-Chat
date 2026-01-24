// middleware/classAuth.js - Class-specific Authorization
const Class = require("../models/Class");
const ClassEnrollment = require("../models/ClassEnrollment");
const { NotFoundError, ForbiddenError, AppError } = require("../utils/errors");

const isTeacher = (req, res, next) => {
  console.log(req.user.role);

  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    throw new ForbiddenError("Access denied. Teacher role required.");
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.user.role !== "student" && req.user.role !== "admin") {
    throw new ForbiddenError("Access denied. Student role required.");
  }
  next();
};

const isClassTeacher = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    if (
      classDoc.teacher.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ForbiddenError(
        "Access denied. You are not the teacher of this class."
      );
    }

    req.class = classDoc;
    next();
  } catch (error) {
    next(error);
  }
};

const isClassMember = async (req, res, next) => {
  try {
    const classId = req.params.classId;

    // Check if user is teacher of the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    const isTeacher = classDoc.teacher.toString() === req.user._id.toString();

    // Check if user is enrolled student
    let isEnrolled = false;
    if (!isTeacher) {
      const enrollment = await ClassEnrollment.findOne({
        student: req.user._id,
        class: classId,
        status: "active",
      });
      isEnrolled = !!enrollment;
    }

    if (!isTeacher && !isEnrolled && req.user.role !== "admin") {
      throw new ForbiddenError(
        "Access denied. You are not a member of this class."
      );
    }

    req.class = classDoc;
    req.isClassTeacher = isTeacher;
    next();
  } catch (error) {
    next(error);
  }
};

const validateClassAccess = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const classId = req.params.id || req.params.classId;
      const classDoc = await Class.findById(classId);

      if (!classDoc) {
        throw new NotFoundError("Class");
      }

      const isTeacher = classDoc.teacher.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      // Check enrollment for students
      let enrollment = null;
      if (!isTeacher && !isAdmin) {
        enrollment = await ClassEnrollment.findOne({
          student: req.user._id,
          class: classId,
          status: "active",
        });
      }

      const isEnrolledStudent = !!enrollment;

      // Role-based access control
      switch (requiredRole) {
        case "teacher":
          if (!isTeacher && !isAdmin) {
            throw new ForbiddenError("Teacher access required");
          }
          break;
        case "student":
          if (!isEnrolledStudent && !isAdmin) {
            throw new ForbiddenError("Student enrollment required");
          }
          break;
        case "member":
          if (!isTeacher && !isEnrolledStudent && !isAdmin) {
            throw new ForbiddenError("Class membership required");
          }
          break;
      }

      req.class = classDoc;
      req.enrollment = enrollment;
      req.isClassTeacher = isTeacher;
      req.isEnrolledStudent = isEnrolledStudent;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  isTeacher,
  isStudent,
  isClassTeacher,
  isClassMember,
  validateClassAccess,
};
