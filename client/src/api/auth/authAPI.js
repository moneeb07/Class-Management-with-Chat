import { login } from "./login";
import { signUp } from "./signUp";
export const authAPI = {
  // Login API call
  login: login,
  signUp: signUp,

  // Verify email (for future email verification feature)
  verifyEmail: async (token) => {
    console.log(token);
    // Simulate email verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ verified: true });
      }, 1000);
    });
  },
  // Verify token (for future use)
  verifyToken: async (token) => {
    // Simulate token verification
    if (!token) {
      throw new Error("No token provided");
    }
    return { valid: true, token };
  },
};
