import { api } from "./axiosConfig";

// Class API methods
export const classApi = {
  // Create a new class
  createClass: async (classData) => {
    const response = await api.post("/classes", classData);
    return response.data;
  },

  // Get all classes for the current user
  getClasses: async (endpoint, params = {}) => {
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // Get class details by ID
  getClassById: async (classId) => {
    const response = await api.get(`/classes/${classId}`);
    console.log(response);

    return response.data;
  },

  // Update class
  updateClass: async (classId, classData) => {
    console.log(classData);

    const response = await api.put(`/classes/${classId}`, classData);
    return response.data;
  },

  // Delete class
  deleteClass: async (classId) => {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  },

  // Get class statistics (teacher only)
  getClassStatistics: async (classId) => {
    const response = await api.get(`/classes/${classId}/statistics`);
    return response.data;
  },
};
