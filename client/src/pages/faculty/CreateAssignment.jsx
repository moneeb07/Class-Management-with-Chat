
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classAssignmentApi } from "../../api/classAssignmentApi";
import { toast } from "react-hot-toast";

const ALLOWED_FILE_TYPES = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "zip",
  "cpp",
  "java",
  "py",
  "js",
  "html",
  "css",
  "json",
];

export default function CreateAssignment() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      instructions: "",
      type: "writing",
      totalMarks: 100,
      dueDate: "",
      allowLateSubmission: true,
      latePenaltyPercentage: 5,
      maxAttempts: 1,
      allowedFileTypes: ["pdf", "doc", "docx", "txt", "zip"],
      maxFileSize: 10,
      maxFiles: 5,
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => classAssignmentApi.createAssignment(classId, data),
    onSuccess: () => {
      toast.success("Assignment created successfully");
      queryClient.invalidateQueries(["assignments", "list", classId]);
      navigate(`/app/classes/${classId}`);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create assignment"
      );
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "allowedFileTypes") {
        data[key].forEach((type) => formData.append("allowedFileTypes[]", type));
      } else if (key === "questionFile") {
        if (data[key] && data[key][0]) {
          formData.append("questionFile", data[key][0]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });

    createAssignmentMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
          <p className="text-gray-500 mt-1">Add a new assignment for your class</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Basic Information
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", {
                  required: "Assignment title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be between 3 and 200 characters",
                  },
                  maxLength: {
                    value: 200,
                    message: "Title must be between 3 and 200 characters",
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="e.g. Essay on Climate Change"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("description", {
                  required: "Assignment description is required",
                  minLength: {
                    value: 10,
                    message: "Description must be between 10 and 2000 characters",
                  },
                  maxLength: {
                    value: 2000,
                    message: "Description must be between 10 and 2000 characters",
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                rows={3}
                placeholder="Brief summary of the assignment..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                {...register("instructions")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                rows={4}
                placeholder="Detailed instructions for students..."
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach File <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="file"
                {...register("questionFile")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a problem statement, dataset, or resource file.
              </p>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuration
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                {...register("type")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              >
                <option value="writing">Writing / Essay</option>
                <option value="coding">Coding</option>
                <option value="project">Project</option>
                <option value="drawing">Drawing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register("dueDate", {
                  required: "Due date is required",
                  validate: (value) =>
                    new Date(value) > new Date() ||
                    "Due date must be in the future",
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("totalMarks", {
                  required: "Total marks is required",
                  min: {
                    value: 1,
                    message: "Total marks must be between 1 and 1000",
                  },
                  max: {
                    value: 1000,
                    message: "Total marks must be between 1 and 1000",
                  },
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Attempts
              </label>
              <input
                type="number"
                {...register("maxAttempts", {
                  min: {
                    value: 1,
                    message: "Max attempts must be between 1 and 10",
                  },
                  max: {
                    value: 10,
                    message: "Max attempts must be between 1 and 10",
                  },
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Submission Settings */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Submission Rules
          </h2>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowLate"
                {...register("allowLateSubmission")}
                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLate" className="text-sm font-medium text-gray-700 cursor-pointer">
                Allow Late Submissions
              </label>
            </div>

            {watch("allowLateSubmission") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Late Penalty (% per day)</label>
                <input 
                  type="number" 
                  {...register("latePenaltyPercentage", {
                    min: {
                      value: 0,
                      message: "Late penalty must be between 0 and 100 percent",
                    },
                    max: {
                      value: 100,
                      message: "Late penalty must be between 0 and 100 percent",
                    },
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                {errors.latePenaltyPercentage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.latePenaltyPercentage.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
              <input 
                type="number"
                {...register("maxFileSize", {
                  min: {
                    value: 1,
                    message: "Max file size must be between 1 and 100 MB",
                  },
                  max: {
                    value: 100,
                    message: "Max file size must be between 1 and 100 MB",
                  },
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
             
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Files Allowed</label>
              <input 
                type="number"
                {...register("maxFiles", {
                  min: {
                    value: 1,
                    message: "Max files must be between 1 and 20",
                  },
                  max: {
                    value: 20,
                    message: "Max files must be between 1 and 20",
                  },
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
             
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_FILE_TYPES.map(type => (
                  <label key={type} className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                    <input 
                      type="checkbox" 
                      value={type} 
                      {...register("allowedFileTypes")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium uppercase text-gray-600">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
