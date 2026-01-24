// const API_BASE_URL = "http://localhost:3001";
// import { api } from "../../api/axiosConfig";
// export const signUp = async (userData) => {
//   // First, check if user already exists
//   const checkResponse = await api.get("/users"); // relative to baseURL

//   if (!checkResponse.ok) {
//     throw new Error("Network error occurred");
//   }

//   const existingUsers = await checkResponse.json();

//   // Check if email already exists with same role
//   const userExists = existingUsers.find(
//     (u) => u.email === userData.email && u.role === userData.role
//   );

//   if (userExists) {
//     throw new Error(`${userData.role} account with this email already exists`);
//   }

//   // Create new user with role
//   const newUser = {
//     id: Date.now(),
//     email: userData.email,
//     password: userData.password,
//     name: userData.name || userData.email.split("@")[0],
//     role: userData.role,
//     createdAt: new Date().toISOString(),
//   };

//   // Post new user to fake server
//   const response = await fetch(`${API_BASE_URL}/users`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(newUser),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to create account");
//   }

//   const createdUser = await response.json();

//   return {
//     token: createdUser.token,
//     user: {
//       id: createdUser.id,
//       email: createdUser.email,
//       name: createdUser.name,
//       role: createdUser.role,
//     },
//   };
// };

import { api } from "../axiosConfig";
import { tokenManager } from "../../utils/tokenManager"; // You need to create this

export const signUp = async (userData) => {
  // Call your real backend register endpoint
  const response = await api.post("/auth/register", {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    studentId: userData.studentId, // if student
    employeeId: userData.employeeId, // if teacher
    department: userData.department, // if teacher
  });

  // Extract access token and store in memory
  const { accessToken, user } = response.data.data;
  console.log(accessToken);

  // Store access token in memory (refresh token is automatically in httpOnly cookie)
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
    // accessToken, // For immediate use if needed
  };
};
