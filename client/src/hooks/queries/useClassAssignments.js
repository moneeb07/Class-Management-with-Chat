import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classAssignmentApi } from "../../api/classAssignmentApi";
import { toast } from "react-hot-toast";

// Extend your query keys with assignments
export const assignmentKeys = {
  all: ["assignments"],
  lists: (classId) => [...assignmentKeys.all, "list", classId],
  details: (classId) => [...assignmentKeys.all, "detail", classId],
  detail: (classId, assignmentId) => [
    ...assignmentKeys.details(classId),
    assignmentId,
  ],
};
// download
export const useDownloadAssignmentZip = () => {
  return useMutation({
    mutationFn: async ({ classId, assignmentId, filename }) => {
      return await classAssignmentApi.downloadAssignmentZip(
        classId,
        assignmentId,
        filename
      );
    },
    onSuccess: () => toast.success("Download started"),
    onError: () => toast.error("Failed to download assignment"),
  });
};

// ✅ Fetch specific assignment of a class

export const useGetAssignment = (classId, assignmentId, options = {}) => {
  return useQuery({
    queryKey: assignmentKeys.detail(classId, assignmentId),
    queryFn: async () => {
      if (!classId || !assignmentId)
        throw new Error("classId and assignmentId are required");
      // 👇 fetch full response
      const response = await classAssignmentApi.getClassAssignment(
        classId,
        assignmentId
      );

      // 👇 extract only `data` from { success, message, data }
      return response.data;
    },
    enabled: !!classId && !!assignmentId, // only fetch when both are provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch assignment";
      toast.error(errorMessage);
    },
    ...options,
  });
};
// ✅ Fetch assignments of a class
export const useGetClassAssignments = (classId, options = {}) => {
  return useQuery({
    queryKey: assignmentKeys.lists(classId),
    queryFn: async () => {
      if (!classId) throw new Error("classId is required");
      return classAssignmentApi.getClassAssignments(classId);
    },
    enabled: !!classId, // only fetch if classId is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch assignments";
      toast.error(errorMessage);
    },
    ...options,
  });
};
// ✅ update assignments of a class

export const useUpdateAssignment = (classId, assignmentId, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData) => {
      if (!classId || !assignmentId)
        throw new Error("classId and assignmentId are required");
      return classAssignmentApi.updateClassAssignment(
        classId,
        assignmentId,
        updatedData
      );
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Assignment updated successfully");

      // invalidate the cache so it refetches the latest data
      queryClient.invalidateQueries(
        assignmentKeys.detail(classId, assignmentId)
      );

      if (options.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update assignment";
      toast.error(errorMessage);
      if (options.onError) options.onError(error);
    },
    ...options,
  });
};
