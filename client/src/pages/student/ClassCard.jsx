import React from "react";
import {
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  UserCheck,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";

const ClassCard = ({ role, classData }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const classId = role === "teacher" ? classData.id : classData.class?.id;
    if (classId) {
      navigate(`/app/classes/${classId}`);
    }
  };

  // Extract correct object
  const data = role === "teacher" ? classData : classData.class;
  const teacher = role === "student" ? data?.teacher : null;

  // For students, get enrollment-specific data
  const enrollmentData = role === "student" ? classData : null;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-green-50/50",
        "border-green-50 hover:border-green-100 bg-gradient-to-br from-white to-green-25/20",
        "hover:scale-[1.02] hover:-translate-y-1"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-600 transition-colors">
              {data?.className}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4 text-green-500" />
              <span>{data?.subject}</span>
            </div>
            {role === "student" && teacher && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4 text-green-500" />
                <span>{teacher.fullName}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {/* Class Active/Inactive Status */}
            <Badge
              className={cn(
                "text-xs",
                data?.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {data?.isActive ? "Active" : "Inactive"}
            </Badge>

            {/* Student Enrollment Status */}
            {role === "student" && enrollmentData?.status && (
              <Badge
                className={cn(
                  "text-xs",
                  enrollmentData.status === "active"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : enrollmentData.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                )}
              >
                {enrollmentData.status === "active"
                  ? "Enrolled"
                  : enrollmentData.status === "completed"
                    ? "Completed"
                    : enrollmentData.status.charAt(0).toUpperCase() +
                      enrollmentData.status.slice(1)}
              </Badge>
            )}

            {/* Teacher Class Code */}
            {role === "teacher" && data?.classCode && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Code: {data.classCode}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Academic Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-green-500" />
            <span>
              {data?.semester} {data?.academicYear}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-50">
          {role === "teacher" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-50 rounded-md">
                  <Users className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enrolled</p>
                  <p className="text-sm font-medium text-gray-900">
                    {classData?.metrics?.totalEnrollments || 0}
                    {classData?.maxStudents ? `/${classData.maxStudents}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-50 rounded-md">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Grade</p>
                  <p className="text-sm font-medium text-gray-900">
                    {classData?.metrics?.averageGrade?.toFixed(1) || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 col-span-2">
                <div className="p-1.5 bg-green-50 rounded-md">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                  <p className="text-sm font-medium text-gray-900">
                    {classData?.metrics?.completionRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Student Attendance */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-50 rounded-md">
                  <Clock className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Attendance</p>
                  <p className="text-sm font-medium text-gray-900">
                    {enrollmentData?.attendance || 0}%
                  </p>
                </div>
              </div>

              {/* Student Progress */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-50 rounded-md">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-sm font-medium text-gray-900">
                    {enrollmentData?.completedAssignments || 0}/
                    {enrollmentData?.assignmentCount || 0}
                  </p>
                </div>
              </div>

              {/* Student Grade (if available) */}
              {enrollmentData?.letterGrade && (
                <div className="flex items-center gap-2 col-span-2">
                  <div className="p-1.5 bg-green-50 rounded-md">
                    <Award className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Grade</p>
                    <p className="text-sm font-medium text-gray-900">
                      {enrollmentData.letterGrade}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
