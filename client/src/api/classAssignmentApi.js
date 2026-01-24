import { api } from "./axiosConfig";

export const classAssignmentApi = {
  // existing methods...

  getClassAssignments: async (classId) => {
    const { data } = await api.get(`/classes/${classId}/assignments`);
    return data;
  },
  // ✅ new method for a specific assignment
  getClassAssignment: async (classId, assignmentId) => {
    const { data } = await api.get(
      `/classes/${classId}/assignments/${assignmentId}`
    );
    return data;
  },
  updateClassAssignment: async (classId, assignmentId, updatedData) => {
    const { data } = await api.put(
      `/classes/${classId}/assignments/${assignmentId}`,
      updatedData
    );
    return data;
  },

  downloadAssignmentZip: async (classId, assignmentId, filename) => {
    const response = await api.get(
      `/classes/${classId}/assignments/${assignmentId}/download?filename=${filename}`,
      { responseType: "blob" } // for binary file
    );

    // ✅ Create temporary URL to download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `assignment_${assignmentId}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  createAssignment: async (classId, assignmentData) => {
    // assignmentData should be a FormData object if files are included
    const { data } = await api.post(
      `/classes/${classId}/assignments`,
      assignmentData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  getSubmissions: async (classId, assignmentId) => {
    const { data } = await api.get(
      `/classes/${classId}/assignments/${assignmentId}/submissions`
    );
    return data;
  },
};
