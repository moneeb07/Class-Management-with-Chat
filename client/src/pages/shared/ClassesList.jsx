import React from "react";
import { AlertCircle, BookOpen } from "lucide-react";
import { useGetClasses } from "../../hooks/queries/useClasses";
import ClassCard from "../student/ClassCard";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "../../hooks/auth/useAuth";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const ClassesList = ({ role = "student" }) => {
  const { user } = useAuth();
  const userRole = user?.role || role;

  const { data, isLoading, error, isError } = useGetClasses(userRole);

  if (isLoading) {
    return <LoadingSpinner text={"classes..."} />;
  }

  if (isError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load classes: {error?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  // Extract classes based on user role
  const classes =
    userRole === "teacher"
      ? data?.data?.classes || []
      : data?.data?.enrollments || [];

  // Filter out enrollments where class is null (like your first enrollment)
  const validClasses =
    userRole === "student"
      ? classes.filter((enrollment) => enrollment.class !== null)
      : classes;

  if (validClasses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No classes found
        </h3>
        <p className="text-gray-600 text-sm">
          {userRole === "teacher"
            ? "You haven't created any classes yet."
            : "You're not enrolled in any classes yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === "teacher" ? "My Classes" : "Enrolled Classes"}
        </h2>
        <div className="text-sm text-gray-500">
          {validClasses.length}{" "}
          {validClasses.length === 1 ? "class" : "classes"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {validClasses.map((classItem) => (
          <ClassCard
            key={
              userRole === "teacher" ? classItem.id : classItem.id // enrollment id
            }
            role={userRole}
            classData={classItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ClassesList;
