import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classApi } from "../../api/classApi";
import { toast } from "react-hot-toast";

// Query keys
export const classKeys = {
  all: ["classes"],
  lists: () => [...classKeys.all, "list"],
  list: (filters) => [...classKeys.lists(), { filters }],
  details: () => [...classKeys.all, "detail"],
  detail: (id) => [...classKeys.details(), id],
  statistics: (id) => [...classKeys.all, "statistics", id],
};

// Get all classes
export const useGetClasses = (role, params = {}) => {
  return useQuery({
    queryKey: classKeys.list({ role, ...params }),
    queryFn: async () => {
      const endpoint =
        role === "teacher" ? "/classes/my-classes" : "/classes/enrolled";
      return classApi.getClasses(endpoint, params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get class details
export const useGetClassDetails = (classId, options = {}) => {
  return useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: () => classApi.getClassById(classId),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get class statistics
export const useGetClassStatistics = (classId, options = {}) => {
  return useQuery({
    queryKey: classKeys.statistics(classId),
    queryFn: () => classApi.getClassStatistics(classId),
    enabled: !!classId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Create class mutation
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.createClass,
    onSuccess: (data) => {
      // Invalidate and refetch classes list
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });

      toast.success("Class created successfully!");

      return data;
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to create class";
      toast.error(errorMessage);
      throw error;
    },
  });
};

// Update class mutation
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, ...classData }) =>
      classApi.updateClass(classId, classData),
    onSuccess: async (data, variables) => {
      // Remove the cached data first to force loading state
      queryClient.removeQueries({
        queryKey: classKeys.detail(variables.classId),
      });

      // Then refetch the data (this will show loading since cache is removed)
      await queryClient.refetchQueries({
        queryKey: classKeys.detail(variables.classId),
      });

      // Invalidate classes list to reflect changes for all calsses
      queryClient.invalidateQueries({
        queryKey: classKeys.lists(),
      });
      toast.success("Class updated successfully!");
      return data;
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update class";
      toast.error(errorMessage);
      throw error;
    },
  });
};

// Delete class mutation
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.deleteClass,
    onSuccess: (data, classId) => {
      // Remove the class from cache
      queryClient.removeQueries({ queryKey: classKeys.detail(classId) });

      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });

      toast.success("Class deleted successfully!");

      return data;
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to delete class";
      toast.error(errorMessage);
      throw error;
    },
  });
};
