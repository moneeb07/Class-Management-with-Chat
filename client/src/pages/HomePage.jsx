import React from "react";
import { useAuth } from "../hooks/auth/useAuth";

export default function HomePage() {
  return (
    <div>
      <button
        onClick={() => {
          navigate("/login");
          document.cookie =
            "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
        }}
        className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl shadow hover:bg-emerald-600 transition"
      >
        Go to login page
      </button>
    </div>
  );
}
