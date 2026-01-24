// api/auth.js
import { api } from "../axiosConfig";
import { tokenManager } from "../../utils/tokenManager";

export const login = async (credentials) => {
  const response = await api.post("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  const { accessToken, user } = response.data.data;

  // Store access token (refresh is in httpOnly cookie)
  tokenManager.setAccessToken(accessToken);

  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      employeeId: user.employeeId,
      department: user.department,
    },
    // accessToken,
  };
};
