"use client";

import { useState } from "react";
import {
  useGetClassDetails,
  useUpdateClass,
} from "../../hooks/queries/useClasses";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import AssignmentsList from "./AssignmentsList";
import { useParams } from "react-router-dom";

const ClassDetails = () => {
  const { classId } = useParams();

  const {
    data: classData,
    isLoading: isLoadingDetails,
    error,
    isFetching: isFetchingDetails,
  } = useGetClassDetails(classId);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { mutateAsync: updateClass } = useUpdateClass();

  // --- Loading State ---
  if (isLoadingDetails || (!classData && isFetchingDetails))
    return <LoadingSpinner text={"class details..."} />;

  // --- Error State ---
  if (error) return <ErrorMessage text={"class details.."} />;

  const classInfo = classData?.data?.class;

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <p className="text-emerald-700">No class data found</p>
      </div>
    );
  }

  // --- Role checks ---
  const isTeacher = classInfo.userRole === "teacher";
  const isStudent = classInfo.userRole === "student";
  const teacherName = classInfo.teacher?.fullName;

  // Initialize editing data when entering edit mode
  const handleEditClick = () => {
    setIsEditing(true);
    setEditingData({
      className: classInfo.className,
      subject: classInfo.subject,
      semester: classInfo.semester,
      academicYear: classInfo.academicYear,
      description: classInfo.description || "",
      maxStudents: classInfo.maxStudents,
      isActive: classInfo.isActive,
      enrollmentKeyExpiry: classInfo.enrollmentKeyExpiry
        ? new Date(classInfo.enrollmentKeyExpiry).toISOString().split("T")[0]
        : "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData({});
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const dataToUpdate = { ...editingData };
      if (dataToUpdate.enrollmentKeyExpiry) {
        dataToUpdate.enrollmentKeyExpiry = new Date(
          dataToUpdate.enrollmentKeyExpiry
        );
      }

      await updateClass({
        classId: classId,
        updates: dataToUpdate,
      });

      setIsEditing(false);
      setEditingData({});
    } catch (error) {
      console.error("Failed to update class:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditingData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper function to render editable field
  const renderEditableField = (
    label,
    field,
    type = "text",
    options = null
  ) => {
    const value = editingData[field];
    const displayValue = classInfo[field];

    return (
      <div>
        <label className="block text-sm font-medium text-emerald-700">
          {label}
        </label>
        {isEditing ? (
          <>
            {type === "select" ? (
              <select
                value={value || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-emerald-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : type === "checkbox" ? (
              <label className="flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => handleInputChange(field, e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-emerald-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  {value ? "Enabled" : "Disabled"}
                </span>
              </label>
            ) : type === "textarea" ? (
              <textarea
                value={value || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-emerald-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            ) : (
              <input
                type={type}
                value={value || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-emerald-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            )}
          </>
        ) : (
          <p className="text-gray-900 mt-1">
            {type === "checkbox"
              ? displayValue
                ? "Enabled"
                : "Disabled"
              : type === "date"
                ? displayValue
                  ? new Date(displayValue).toLocaleDateString()
                  : "N/A"
                : displayValue || "N/A"}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              {renderEditableField("Class Name", "className")}
              <div className="mt-2 flex space-x-4">
                {renderEditableField("Subject", "subject")}
                {renderEditableField("Semester", "semester")}
                {renderEditableField("Academic Year", "academicYear")}
              </div>
              {renderEditableField("Description", "description", "textarea")}
            </div>
            <div className="text-right flex-shrink-0">
              {isEditing ? (
                renderEditableField("Status", "isActive", "select", [
                  { value: true, label: "Active" },
                  { value: false, label: "Inactive" },
                ])
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    classInfo.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {classInfo.isActive ? "Active" : "Inactive"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 mb-8">
          <div className="border-b border-emerald-100">
            <nav className="flex space-x-8 px-6">
              {["overview", "assignments"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-emerald-800">
                    Class Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-700">
                        Teacher
                      </label>
                      <p className="text-gray-900">{teacherName}</p>
                    </div>

                    {renderEditableField(
                      "Maximum Students",
                      "maxStudents",
                      "number"
                    )}

                    {classInfo.metrics && (
                      <div>
                        <label className="block text-sm font-medium text-emerald-700">
                          Enrolled Students
                        </label>
                        <p className="text-gray-900">
                          {classInfo.metrics.totalEnrollments} /{" "}
                          {isEditing
                            ? editingData.maxStudents
                            : classInfo.maxStudents}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Enrollment details (Student only) */}
                  {isStudent && classInfo.enrollment && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-emerald-800 mb-2">
                        Your Enrollment
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {classInfo.enrollment.status}
                        </p>
                        <p>
                          <span className="font-medium">Attendance:</span>{" "}
                          {classInfo.enrollment.attendance}%
                        </p>
                        <p>
                          <span className="font-medium">Final Grade:</span>{" "}
                          {classInfo.enrollment.finalGrade || "N/A"}{" "}
                          {classInfo.enrollment.letterGrade &&
                            `(${classInfo.enrollment.letterGrade})`}
                        </p>
                        <p>
                          <span className="font-medium">Enrolled At:</span>{" "}
                          {new Date(
                            classInfo.enrollment.enrolledAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Teacher-only info */}
                  {isTeacher && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-emerald-700">
                          Class Code
                        </label>
                        <p className="text-gray-900 font-mono">
                          {classInfo.classCode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-emerald-700">
                          Enrollment Key
                        </label>
                        <p className="text-gray-900 font-mono">
                          {classInfo.enrollmentKey}
                        </p>
                      </div>

                      {renderEditableField(
                        "Enrollment Key Expiry",
                        "enrollmentKeyExpiry",
                        "date"
                      )}
                    </>
                  )}
                </div>

                {/* Metrics (Teacher Only) */}
                {isTeacher && classInfo.metrics && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-emerald-800">
                      Performance Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-700">
                          Total Enrollments
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {classInfo.metrics.totalEnrollments}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <p className="text-sm font-medium text-purple-700">
                          Average Grade
                        </p>
                        <p className="text-2xl font-bold text-purple-800">
                          {classInfo.metrics.averageGrade}%
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <p className="text-sm font-medium text-orange-700">
                          Completion Rate
                        </p>
                        <p className="text-2xl font-bold text-orange-800">
                          {classInfo.metrics.completionRate}%
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-emerald-700">
                        Last Calculated
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          classInfo.metrics.lastCalculated
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                    Class Assignments
                  </h3>
                  <p className="text-gray-600">
                    View and manage all assignments for this class.
                  </p>
                </div>
                <AssignmentsList classId={classId} role={classInfo.userRole} />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Teacher Only) */}
        {isTeacher && (
          <div className="flex justify-end space-x-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-transparent rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:opacity-50 flex items-center shadow-md"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditClick}
                  className="px-6 py-2.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  Edit Class
                </button>
                <button className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-transparent rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-md">
                  Manage Students
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
