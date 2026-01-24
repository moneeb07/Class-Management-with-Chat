// utils/tokenManager.js
class TokenManager {
  constructor() {
    this.accessTokenKey = "accessToken";
    this.tokenExpiryKey = "tokenExpiry";
  }

  setAccessToken(token) {
    try {
      sessionStorage.setItem(this.accessTokenKey, token);

      // Decode token to get expiry (optional but helpful for debugging)
      if (token) {
        const payload = this.decodeTokenPayload(token);
        if (payload?.exp) {
          sessionStorage.setItem(this.tokenExpiryKey, payload.exp * 1000); // Convert to milliseconds
        }
      }
    } catch (error) {
      console.error("Error setting access token:", error);
    }
  }

  getAccessToken() {
    try {
      const token = sessionStorage.getItem(this.accessTokenKey);

      // Optional: Check if token is expired before returning
      if (token && this.isTokenExpired()) {
        console.log("Token expired, clearing...");
        this.clearTokens();
        return null;
      }

      return token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  clearTokens() {
    try {
      sessionStorage.removeItem(this.accessTokenKey);
      sessionStorage.removeItem(this.tokenExpiryKey);
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }

  // Helper method to decode JWT payload (without verification)
  decodeTokenPayload(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  // Check if token is expired (with 30 second buffer)
  isTokenExpired() {
    try {
      const expiry = sessionStorage.getItem(this.tokenExpiryKey);
      if (!expiry) return false;

      const expiryTime = parseInt(expiry);
      const currentTime = Date.now();
      const bufferTime = 30 * 1000; // 30 seconds buffer

      return currentTime >= expiryTime - bufferTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return false;
    }
  }

  // Get token expiry time
  getTokenExpiry() {
    try {
      const expiry = sessionStorage.getItem(this.tokenExpiryKey);
      return expiry ? new Date(parseInt(expiry)) : null;
    } catch (error) {
      console.error("Error getting token expiry:", error);
      return null;
    }
  }

  // Check if user has valid token
  isAuthenticated() {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }
}

export const tokenManager = new TokenManager();
