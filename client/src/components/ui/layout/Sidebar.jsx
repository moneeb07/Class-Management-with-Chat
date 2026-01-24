import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/auth/useAuth";
import {
  HomeIcon,
  AcademicCapIcon,
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implement logout logic
    navigate("/login");
  };

  const facultyNavItems = [
    { name: "Dashboard", href: "/app/dashboard", icon: HomeIcon },
    { name: "My Classes", href: "/app/classes", icon: AcademicCapIcon },
    { name: "Create Class", href: "/app/classes/create", icon: PlusIcon },
    { name: "Profile", href: "/app/profile", icon: UserIcon },
  ];

  const studentNavItems = [
    { name: "Dashboard", href: "/app/dashboard", icon: HomeIcon },
    { name: "My Classes", href: "/app/classes", icon: AcademicCapIcon },
    { name: "Join Class", href: "/app/classes/join", icon: PlusIcon },
    { name: "Submissions", href: "/app/submissions", icon: DocumentTextIcon },
    { name: "Grades", href: "/app/grades", icon: ChartBarIcon },
    { name: "Profile", href: "/app/profile", icon: UserIcon },
  ];

  const navItems = user?.role === "student" ? studentNavItems : facultyNavItems;

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">ClassroomAI</h1>
        <p className="text-sm text-gray-500 capitalize">{user?.role} Portal</p>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      {/* User Info & Logout */}
      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <PowerIcon className="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
