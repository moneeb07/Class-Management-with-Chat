"use client";

import { useNavigate } from "react-router-dom";
import LoginForm from "../../features/auth/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <LoginForm />
      <button
        onClick={() => {
          navigate("/app");
          document.cookie =
            "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
        }}
        className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl shadow hover:bg-emerald-600 transition"
      >
        Go to Form
      </button>
    </div>
  );
};

export default LoginPage;
