// ======================================
// utils/helpers.js
// ======================================

const crypto = require("crypto");

// Generate unique codes for assignments, classes etc
exports.generateUniqueCode = (prefix = "", length = 8) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = prefix;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

// Generate secure random string
exports.generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Format file size in human readable format
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Sanitize filename
exports.sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
};

// Calculate grade statistics
exports.calculateGradeStats = (grades) => {
  if (!grades || grades.length === 0) {
    return {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    };
  }

  const sortedGrades = [...grades].sort((a, b) => a - b);
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  const average = sum / grades.length;

  // Median
  const mid = Math.floor(sortedGrades.length / 2);
  const median =
    sortedGrades.length % 2 !== 0
      ? sortedGrades[mid]
      : (sortedGrades[mid - 1] + sortedGrades[mid]) / 2;

  // Standard deviation
  const variance =
    grades.reduce((acc, grade) => acc + Math.pow(grade - average, 2), 0) /
    grades.length;
  const standardDeviation = Math.sqrt(variance);

  // Grade distribution
  const distribution = {
    A: grades.filter((g) => g >= 90).length,
    B: grades.filter((g) => g >= 80 && g < 90).length,
    C: grades.filter((g) => g >= 70 && g < 80).length,
    D: grades.filter((g) => g >= 60 && g < 70).length,
    F: grades.filter((g) => g < 60).length,
  };

  return {
    average: Math.round(average * 100) / 100,
    median,
    min: Math.min(...sortedGrades),
    max: Math.max(...sortedGrades),
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    distribution,
  };
};

// Time formatting utilities
exports.formatTimeRemaining = (dueDate) => {
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();

  if (timeDiff <= 0) return "Overdue";

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${
      hours > 1 ? "s" : ""
    }`;
  if (hours > 0)
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${
      minutes > 1 ? "s" : ""
    }`;
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
};

// Pagination helper
exports.getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// Sort helper
exports.getSortParams = (query) => {
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.order === "asc" ? 1 : -1;

  const sort = {};
  sort[sortBy] = sortOrder;

  return sort;
};

// Email validation
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
exports.validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generate assignment code
exports.generateAssignmentCode = (classCode, assignmentType) => {
  const typePrefix = {
    coding: "COD",
    writing: "WRT",
    project: "PRJ",
    quiz: "QUZ",
    drawing: "DRW",
    "system-design": "SYS",
    lab: "LAB",
  };

  const prefix = typePrefix[assignmentType] || "ASN";
  const randomString = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${classCode}-${prefix}-${randomString}`;
};

// File type validation
exports.validateFileType = (filename, allowedTypes) => {
  const extension = filename.split(".").pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Content type detection
exports.detectContentType = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();

  const contentTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    zip: "application/zip",
    cpp: "text/plain",
    java: "text/plain",
    py: "text/plain",
    js: "text/javascript",
    html: "text/html",
    css: "text/css",
    json: "application/json",
  };

  return contentTypes[extension] || "application/octet-stream";
};

// Array utilities
exports.removeDuplicates = (array, key) => {
  if (!key) return [...new Set(array)];

  const seen = new Set();
  return array.filter((item) => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

// Object utilities
exports.pickFields = (obj, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      result[field] = obj[field];
    }
  });
  return result;
};

exports.omitFields = (obj, fields) => {
  const result = { ...obj };
  fields.forEach((field) => {
    delete result[field];
  });
  return result;
};
