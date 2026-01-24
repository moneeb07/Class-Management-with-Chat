"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AssignmentCard = ({ assignment, role }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      case "submitted":
        return "bg-emerald-100 text-emerald-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "coding":
        return "bg-blue-100 text-blue-800";
      case "writing":
        return "bg-purple-100 text-purple-800";
      case "drawing":
        return "bg-pink-100 text-pink-800";
      case "project":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue =
    new Date(assignment.dueDate) < new Date() &&
    assignment.submissionStatus !== "submitted";

  const handleCardClick = () => {
    navigate(`assignments/${assignment._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {assignment.title}
          </h3>
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                assignment.type
              )}`}
            >
              {assignment.type}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                assignment.submissionStatus
              )}`}
            >
              {assignment.submissionStatus?.replace("_", " ")}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {assignment.totalMarks} pts
          </p>
          {assignment.submissionGrade && (
            <p className="text-sm text-emerald-600 font-medium">
              Grade: {assignment.submissionGrade}%
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Due Date</span>
            <p className={`${isOverdue ? "text-red-600 font-medium" : "text-gray-900"}`}>
              {formatDate(assignment.dueDate)}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Teacher</span>
            <p className="text-gray-900">
              {assignment.teacher?.fullName || "N/A"}
            </p>
          </div>
          {assignment.submittedAt && (
            <div>
              <span className="font-medium text-gray-500">Submitted</span>
              <p className="text-gray-900">
                {formatDate(assignment.submittedAt)}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-500">Max Attempts</span>
            <p className="text-gray-900">{assignment.maxAttempts}</p>
          </div>
        </div>

        {assignment.description && (
          <div>
            <span className="font-medium text-gray-500 block mb-1">
              Description
            </span>
            <p className="text-gray-700 text-sm">
              {isExpanded
                ? assignment.description
                : `${assignment.description.substring(0, 150)}${
                    assignment.description.length > 150 ? "..." : ""
                  }`}
            </p>
            {assignment.description.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-1"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Assignment Settings Summary */}
        <div className="pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
            <div>
              <span className="font-medium">Late Submission</span>
              <p className="text-gray-700">
                {assignment.allowLateSubmission ? "Allowed" : "Not Allowed"}
              </p>
            </div>
            {assignment.allowLateSubmission && (
              <div>
                <span className="font-medium">Late Penalty</span>
                <p className="text-gray-700">{assignment.latePenaltyPercentage}%</p>
              </div>
            )}
            <div>
              <span className="font-medium">File Types</span>
              <p className="text-gray-700">{assignment.allowedFileTypes?.join(", ") || "Any"}</p>
            </div>
            <div>
              <span className="font-medium">Max File Size</span>
              <p className="text-gray-700">{assignment.maxFileSize} MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
