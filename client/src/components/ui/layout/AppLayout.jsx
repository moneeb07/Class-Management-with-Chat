import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import ErrorMessage from "../ErrorMessage";
import Layout from "./Layout";

// Faculty Components
import FacultyDashboard from "../../../pages/faculty/FacultyDashboard";
import FacultyClasses from "../../../pages/faculty/FacultyClasses";
import CreateClass from "../../../pages/faculty/CreateClass";
import AssignmentDetail from "../../../pages/faculty/assignmentDetail/AssignmentDetail";
import CreateAssignment from "../../../pages/faculty/CreateAssignment";
import GradingInterface from "../../../pages/faculty/GradingInterface";
import TeacherSubmissionsList from "../../../pages/faculty/TeacherSubmissionsList";
import FacultyProfile from "../../../pages/faculty/FacultyProfile";

// Student Components
import StudentDashboard from "../../../pages/student/StudentDashboard";
import StudentClasses from "../../../pages/student/StudentClasses";
import JoinClass from "../../../pages/student/JoinClass";
import AssignmentSubmission from "../../../pages/student/AssignmentSubmission";
import StudentSubmissions from "../../../pages/student/StudentSubmissions";
import StudentGrades from "../../../pages/student/StudentGrades";
import StudentProfile from "../../../pages/student/StudentProfile";
import { useAuth } from "../../../hooks/auth/useAuth";
//shared
import ClassDetail from "../../../pages/shared/ClassDetail";
import ClassesList from "../../../pages/shared/ClassesList";
const unusedVar = 123;

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingSpinner text={"Layout"} />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        {user.role === "teacher" ? (
          // Faculty Routes
          <>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="classes" element={<ClassesList />} />
            <Route path="classes/create" element={<CreateClass />} />
            <Route path="classes/:classId" element={<ClassDetail />} />
            <Route
              path="classes/:classId/assignments/create"
              element={<CreateAssignment />}
            />
            <Route
              path="classes/:classId/assignments/:assignmentId"
              element={<AssignmentDetail role={user.role} />}
            />
            <Route
              path="classes/:classId/assignments/:assignmentId/grade"
              element={<GradingInterface />}
            />
            <Route
              path="classes/:classId/assignments/:assignmentId/submissions"
              element={<TeacherSubmissionsList />}
            />
            <Route path="profile" element={<FacultyProfile />} />
          </>
        ) : (
          // Student Routes
          <>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route
              path="dashboard"
              element={<StudentDashboard name={user.lastName} />}
            />
            <Route path="classes" element={<ClassesList />} />
            <Route path="classes/join" element={<JoinClass />} />
            <Route path="classes/:classId" element={<ClassDetail />} />
            {/* <Route path="classes/:classId" element={<StudentClassDetail />} /> */}
            <Route
              path="classes/:classId/assignments/:assignmentId"
              element={<AssignmentDetail role={user.role} />}
            />
            <Route path="submissions" element={<StudentSubmissions />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="profile" element={<StudentProfile />} />
          </>
        )}
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
