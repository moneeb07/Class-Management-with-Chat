"use client";

import { useNavigate } from "react-router-dom";
import LoginForm from "../../features/auth/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
