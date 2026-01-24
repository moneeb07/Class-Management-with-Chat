import { authAPI } from "../../api/auth/authAPI";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/axiosConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Pages that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is public (doesn't need auth check)
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );
  // Instead of checking for access token, just check if not on public route
  const shouldFetchUser = !isPublicRoute;

  const {
    data: user,
    isLoading,
    error,
    refetch: checkAuth,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const response = await api.get("/auth/me");

      return response.data.data.user;
    },
    enabled: shouldFetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: "always",
    refetchOnWindowFocus: true, // Recheck when tab becomes active
  });

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      console.log("✅ Login successful:", data);
      queryClient.setQueryData(["auth", "user"], data.user);
      navigate("/app"); // redirect after login
    },
    onError: (error) => {
      console.log("🚨 Login failed:", error);
    },
  });
  const signupMutation = useMutation({
    mutationFn: authAPI.signUp,
    onSuccess: (data) => {
      console.log("✅ Signup successful:", data);
      queryClient.setQueryData(["auth", "user"], data.user);
      navigate("/app"); // or wherever you want to redirect
    },
    onError: (error) => {
      console.log("🚨 Signup failed:", error);
    },
  });
  return {
    user,
    isAuthenticated: !!user && !error,
    isLoading,
    signupMutation,
    loginMutation,
    checkAuth,
  };
};

// Email verification hook (for future use)
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authAPI.verifyEmail,
    onSuccess: (data) => {
      console.log("Email verified:", data);
    },
  });
};

// Get current user hook
export const useCurrentUser = () => {
  return useQuery({
    // queryKey: ["user", "current"],
    // queryFn: () => {
    //   const user = localStorage.getItem("user");
    //   const token = localStorage.getItem("token");
    //   if (!user || !token) {
    //     return null;
    //   }
    //   return {
    //     user: JSON.parse(user),
    //     token,
    //   };
    // },
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check if authenticated
export const useIsAuthenticated = () => {
  const { data } = useCurrentUser();
  return !!data?.token;
};
