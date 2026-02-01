import { User, Mail, BookOpen, Award, Calendar, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/auth/useAuth";

export default function FacultyProfile() {
  const { user } = useAuth();

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "F";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            View and manage your faculty profile information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-green-500 to-green-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end -mt-16 mb-6">
              {/* Avatar */}
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                <span className="text-white text-4xl font-bold">
                  {getInitials(user?.fullName)}
                </span>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 md:mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.fullName || "Faculty Member"}
                </h2>
                <p className="text-gray-500 capitalize">
                  {user?.role || "Faculty"}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {user?.email || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {user?.role || "Faculty"}
                  </p>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-3 rounded-full">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">
                    {user?.department || "Computer Science"}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "January 2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Classes Teaching
                </p>
                <p className="text-3xl font-bold text-green-600">--</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-green-600">--</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Assignments Created
                </p>
                <p className="text-3xl font-bold text-green-600">--</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
