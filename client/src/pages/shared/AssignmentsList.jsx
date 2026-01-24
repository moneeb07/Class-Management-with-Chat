"use client";

import { useState } from "react";
import { useGetClassAssignments } from "../../hooks/queries/useClassAssignments";
import AssignmentCard from "./AssignmentCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";

const AssignmentsList = ({ classId, role }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");

  const {
    data: assignmentsData,
    isLoading,
    error,
    isFetching,
  } = useGetClassAssignments(classId);

  if (isLoading || (!assignmentsData && isFetching)) {
    return <LoadingSpinner text="Loading assignments..." />;
  }

  if (error) {
    return <ErrorMessage text="Failed to load assignments" />;
  }

  const assignments = assignmentsData?.data || [];

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const statusMatch =
      filterStatus === "all" || assignment.submissionStatus === filterStatus;
    const typeMatch = filterType === "all" || assignment.type === filterType;
    return statusMatch && typeMatch;
  });

  // Sort assignments
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        return new Date(a.dueDate) - new Date(b.dueDate);
      case "title":
        return a.title.localeCompare(b.title);
      case "type":
        return a.type.localeCompare(b.type);
      case "status":
        return (a.submissionStatus || "").localeCompare(b.submissionStatus || "");
      default:
        return 0;
    }
  });

  const getStatusCounts = () => {
    const counts = {
      all: assignments.length,
      not_started: 0,
      in_progress: 0,
      submitted: 0,
      overdue: 0,
    };

    assignments.forEach((assignment) => {
      if (assignment.submissionStatus) {
        counts[assignment.submissionStatus] =
          (counts[assignment.submissionStatus] || 0) + 1;
      }
      if (
        new Date(assignment.dueDate) < new Date() &&
        assignment.submissionStatus !== "submitted"
      ) {
        counts.overdue += 1;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No assignments
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No assignments have been created for this class yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="not_started">
                  Not Started ({statusCounts.not_started})
                </option>
                <option value="in_progress">
                  In Progress ({statusCounts.in_progress})
                </option>
                <option value="submitted">
                  Submitted ({statusCounts.submitted})
                </option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="drawing">Drawing</option>
                <option value="project">Project</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="bg-emerald-50 px-3 py-1 rounded-full text-emerald-700 font-medium">
              Total: {assignments.length}
            </span>
            {statusCounts.overdue > 0 && (
              <span className="bg-red-50 px-3 py-1 rounded-full text-red-700 font-medium">
                Overdue: {statusCounts.overdue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedAssignments.map((assignment) => (
          <AssignmentCard
            role={role}
            key={assignment._id}
            assignment={assignment}
          />
        ))}
      </div>

      {filteredAssignments.length === 0 && assignments.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No assignments match the current filters.
          </p>
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterType("all");
            }}
            className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentsList;
