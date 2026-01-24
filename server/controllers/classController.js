// controllers/classController.js - Complete Controller Implementation
const Class = require("../models/Class");
const mongoose = require("mongoose");
const ClassEnrollment = require("../models/ClassEnrollment");
const User = require("../models/User");
const {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");
const logger = require("../utils/logger");
const { CLASS_CONSTANTS } = require("../utils/constants");

// Teacher Routes
const createClass = async (req, res, next) => {
  try {
    const {
      className,
      description,
      subject,
      semester,
      academicYear,
      maxStudents,
    } = req.body;

    const classData = {
      className: className.trim(),
      description: description?.trim(),
      subject: subject.trim(),
      semester,
      academicYear,
      teacher: req.user._id,
      maxStudents: maxStudents || CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_DEFAULT,
      createdBy: req.user._id,
    };

    const newClass = new Class(classData);
    const savedClass = await newClass.save();

    // Update teacher's createdClasses
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { createdClasses: savedClass._id } },
      { new: true }
    );

    await savedClass.populate("teacher", "firstName lastName email");

    logger.info("Class created successfully", {
      classId: savedClass._id,
      teacherId: req.user._id,
      className: savedClass.className,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: {
        class: savedClass,
        enrollmentKey: savedClass.enrollmentKey,
        classCode: savedClass.classCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyClasses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      semester,
      academicYear,
      search,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      semester,
      academicYear,
      search,
    };

    if (isActive !== undefined) {
      options.isActive = isActive === "true";
    }

    const classes = await Class.findActiveByTeacher(req.user._id, options);
    const total = await Class.countDocuments({
      teacher: req.user._id,
      ...(isActive !== undefined && { isActive: isActive === "true" }),
      ...(semester && { semester }),
      ...(academicYear && { academicYear }),
      ...(search && { $text: { $search: search } }),
    });

    // Get enrollment counts for each class
    const classesWithEnrollment = await Promise.all(
      classes.map(async (classDoc) => {
        const enrollmentCount = await ClassEnrollment.countDocuments({
          class: classDoc._id,
          status: "active",
        });

        return {
          ...classDoc.toObject(),
          enrollmentCount,
          availableSpots: classDoc.maxStudents - enrollmentCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        classes: classesWithEnrollment,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updates = req.body.updates || req.body;
    console.log(req.body);
    // Remove immutable fields
    const forbidden = [
      "classCode",
      "teacher",
      "enrollmentKey",
      "createdAt",
      "createdBy",
    ];
    forbidden.forEach((field) => delete updates[field]);

    // Sanitization like in createClass
    if (updates.className) updates.className = updates.className.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.subject) updates.subject = updates.subject.trim();
    if (updates.semester) updates.semester = updates.semester.trim();

    const classDoc = await Class.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate("teacher", "firstName lastName email"); // keep same as createClass

    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    logger.info("Class updated successfully", {
      classId: id,
      teacherId: req.user._id,
      updatedFields: Object.keys(updates),
    });

    res.json({
      success: true,
      message: "Class updated successfully",
      data: {
        class: classDoc,
        enrollmentKey: classDoc.enrollmentKey, // keep consistent with create
        classCode: classDoc.classCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      throw new ValidationError("Confirmation required to delete class");
    }

    const classDoc = await Class.findById(id);
    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    // Check if class has enrolled students
    const enrollmentCount = await ClassEnrollment.countDocuments({
      class: id,
      status: "active",
    });

    if (enrollmentCount > 0) {
      throw new ConflictError(
        "Cannot delete class with enrolled students. Remove students first."
      );
    }

    // Soft delete
    await classDoc.softDelete();

    logger.info("Class deleted", {
      classId: id,
      teacherId: req.user._id,
      className: classDoc.className,
    });

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const generateEnrollmentKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classDoc = await Class.findById(id);
    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    if (!classDoc.isActive) {
      throw new ConflictError("Cannot generate key for inactive class");
    }

    await classDoc.regenerateEnrollmentKey();

    logger.info("Enrollment key regenerated", {
      classId: id,
      teacherId: req.user._id,
    });

    res.json({
      success: true,
      message: "New enrollment key generated",
      data: {
        enrollmentKey: classDoc.enrollmentKey,
        expiresAt: classDoc.enrollmentKeyExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status = "active", page = 1, limit = 50 } = req.query;

    // Convert query params to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Build query options
    const options = {
      sort: { enrolledAt: 1 },
    };

    // Base query
    let query = ClassEnrollment.find({
      class: id,
      ...(status !== "all" && { status }),
    })
      .populate([
        {
          path: "student",
          select: "email firstName lastName rollNumber",
        },
        {
          path: "class",
          select: "className classCode subject teacher semester academicYear",
          populate: { path: "teacher", select: "firstName lastName email" },
        },
      ])
      .sort(options.sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const enrollments = await query;

    // Count total docs
    const total = await ClassEnrollment.countDocuments({
      class: id,
      ...(status !== "all" && { status }),
    });

    // Aggregate class statistics
    const stats = await ClassEnrollment.aggregate([
      { $match: { class: id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgGrade: { $avg: "$finalGrade" },
          avgAttendance: { $avg: "$attendance" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        students: enrollments,
        statistics: stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const { reason } = req.body;

    const enrollment = await ClassEnrollment.findOne({
      student: studentId,
      class: id,
      status: "active",
    });

    if (!enrollment) {
      throw new NotFoundError("Active enrollment");
    }

    await ClassEnrollment.dropStudent(studentId, id, reason, req.user._id);

    logger.info("Student removed from class", {
      classId: id,
      studentId,
      teacherId: req.user._id,
      reason,
    });

    res.json({
      success: true,
      message: "Student removed from class",
    });
  } catch (error) {
    next(error);
  }
};

// Student Routes
const joinClass = async (req, res, next) => {
  try {
    const { enrollmentKey } = req.body;

    if (!enrollmentKey) {
      throw new ValidationError("Enrollment key is required");
    }

    // Find class by enrollment key
    const classDoc = await Class.findByEnrollmentKey(enrollmentKey);

    if (!classDoc) {
      throw new NotFoundError("Valid enrollment key");
    }

    // Enroll student
    const enrollment = await ClassEnrollment.enrollStudent(
      req.user._id,
      classDoc._id,
      enrollmentKey,
      { createdBy: req.user._id }
    );

    await enrollment.populate({
      path: "class",
      select:
        "className classCode subject teacher semester academicYear enrolledCount maxStudents isActive",
      populate: {
        path: "teacher",
        select: "email firstName lastName",
      },
    });
    const data = enrollment.toObject();

    if (data.class?.teacher) {
      const t = data.class.teacher;
      // remove unwanted fields
      delete t.firstName;
      delete t.lastName;
    }
    res.status(201).json({
      success: true,
      message: "Successfully joined class",
      data: { data },
    });
  } catch (error) {
    next(error);
  }
};

const getEnrolledClasses = async (req, res, next) => {
  try {
    const { status = "active", page = 1, limit = 10 } = req.query;

    const options = {
      status: status === "all" ? null : status,
      populate: true,
      sort: "-enrolledAt",
    };

    let query = ClassEnrollment.getStudentEnrollments(req.user._id, options);

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).skip(skip);

    const enrollments = await query;
    const total = await ClassEnrollment.countDocuments({
      student: req.user._id,
      ...(status !== "all" && { status }),
    });

    // Add assignment counts (placeholder for when you implement assignments)
    const enrichedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment.toObject(),
      assignmentCount: 0, // TODO: Implement when Assignment model is ready
      completedAssignments: 0, // TODO: Implement when Assignment model is ready
    }));

    res.json({
      success: true,
      data: {
        enrollments: enrichedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const leaveClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await ClassEnrollment.dropStudent(
      req.user._id,
      id,
      reason || "Student left voluntarily",
      req.user._id
    );

    logger.info("Student left class", {
      classId: id,
      studentId: req.user._id,
      reason,
    });

    res.json({
      success: true,
      message: "Successfully left the class",
    });
  } catch (error) {
    next(error);
  }
};

// Shared Routes
const getClassDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    let classDoc = await Class.findById(id).populate(
      "teacher",
      "firstName lastName email profilePicture"
    );

    if (!classDoc) {
      throw new NotFoundError("Class");
    }

    const isTeacher = req.isClassTeacher;
    const isStudent = req.isEnrolledStudent;

    // Base class information
    let responseData = {
      ...classDoc.toObject(),
      userRole: isTeacher ? "teacher" : isStudent ? "student" : "visitor",
    };

    // Add enrollment-specific data for students
    if (isStudent && req.enrollment) {
      responseData.enrollment = {
        enrolledAt: req.enrollment.enrolledAt,
        status: req.enrollment.status,
        attendance: req.enrollment.attendance,
        finalGrade: req.enrollment.finalGrade,
        letterGrade: req.enrollment.letterGrade,
      };
    }

    // Hide sensitive data for non-teachers
    if (!isTeacher) {
      delete responseData.enrollmentKey;
      delete responseData.enrollmentKeyExpiry;
    }

    // Add statistics for teachers
    if (isTeacher) {
      const stats = await classDoc.getEnrollmentStats();
      responseData.statistics = stats;
    }

    res.json({
      success: true,
      data: { class: responseData },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Teacher routes
  createClass,
  getMyClasses,
  updateClass,
  deleteClass,
  generateEnrollmentKey,
  getClassStudents,
  removeStudent,

  // Student routes
  joinClass,
  getEnrolledClasses,
  leaveClass,

  // Shared routes
  getClassDetails,
};
