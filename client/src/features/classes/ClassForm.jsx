import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

// Constants matching your backend schema
const CLASS_CONSTANTS = {
  LIMITS: {
    CLASS_NAME_MIN: 3,
    CLASS_NAME_MAX: 100,
    SUBJECT_MAX: 50,
    DESCRIPTION_MAX: 500,
    MAX_STUDENTS_MIN: 1,
    MAX_STUDENTS_MAX: 200,
    MAX_STUDENTS_DEFAULT: 50,
  },
  SEMESTERS: ["Fall", "Spring", "Summer", "Winter"],
  PATTERNS: {
    CLASS_CODE: /^\d{3}$/,
    ACADEMIC_YEAR: /^\d{4}-\d{4}$/,
    ENROLLMENT_KEY: /^\d{6}$/,
  },
};

// Validation schema matching your Mongoose schema
const classFormSchema = z.object({
  className: z
    .string()
    .trim()
    .min(1, "Class name is required")
    .min(
      CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN,
      `Class name must be at least ${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MIN} characters`
    )
    .max(
      CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX,
      `Class name cannot exceed ${CLASS_CONSTANTS.LIMITS.CLASS_NAME_MAX} characters`
    ),

  classCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || CLASS_CONSTANTS.PATTERNS.CLASS_CODE.test(val),
      "Class code must be exactly 3 digits"
    ),

  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(
      CLASS_CONSTANTS.LIMITS.SUBJECT_MAX,
      `Subject cannot exceed ${CLASS_CONSTANTS.LIMITS.SUBJECT_MAX} characters`
    ),

  semester: z.enum(CLASS_CONSTANTS.SEMESTERS, {
    required_error: "Semester is required",
    invalid_type_error: `Semester must be one of: ${CLASS_CONSTANTS.SEMESTERS.join(", ")}`,
  }),

  academicYear: z
    .string()
    .min(1, "Academic year is required")
    .refine(
      (val) => CLASS_CONSTANTS.PATTERNS.ACADEMIC_YEAR.test(val),
      "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)"
    ),

  description: z
    .string()
    .trim()
    .max(
      CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX,
      `Description cannot exceed ${CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX} characters`
    )
    .optional()
    .or(z.literal("")),

  maxStudents: z
    .number()
    .min(
      CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN,
      `Maximum students must be at least ${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN}`
    )
    .max(
      CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX,
      `Maximum students cannot exceed ${CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX}`
    ),

  enrollmentKey: z
    .string()
    .optional()
    .refine(
      (val) => !val || CLASS_CONSTANTS.PATTERNS.ENROLLMENT_KEY.test(val),
      "Enrollment key must be exactly 6 digits"
    ),

  isActive: z.boolean().default(true),
});

const ClassForm = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  mode = "create",
  mutationError = null,
  onCancel,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const currentYear = new Date().getFullYear();
  const academicYearOptions = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];

  const defaultValues = {
    className: "",
    classCode: "",
    subject: "",
    semester: "Fall",
    academicYear: `${currentYear}-${currentYear + 1}`,
    description: "",
    maxStudents: CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_DEFAULT,
    enrollmentKey: "",
    isActive: true,
    ...initialData,
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(classFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        ...defaultValues,
        ...initialData,
      });
    }
  }, [initialData]);

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    reset(defaultValues);
    onCancel?.();
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;

    return (
      <p className="text-sm text-red-600 flex items-center mt-1">
        <svg
          className="w-4 h-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error.message}
      </p>
    );
  };

  return (
    <div className="space-y-8">
      {/* Display mutation error */}
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error {mode === "create" ? "Creating" : "Updating"} Class
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {mutationError?.message || "An unexpected error occurred"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-6 transition-all hover:shadow-lg">
          <h2 className="text-xl font-semibold text-emerald-800 mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {mode === "create" ? "Create New Class" : "Edit Class"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Class Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="className"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="e.g., Introduction to Computer Science"
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.className
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  />
                )}
              />
              <ErrorMessage error={errors.className} />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="e.g., Computer Science"
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.subject
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  />
                )}
              />
              <ErrorMessage error={errors.subject} />
            </div>

            {/* Class Code */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Class Code
                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
              </label>
              <Controller
                name="classCode"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="e.g., 101"
                    maxLength={3}
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.classCode
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                  />
                )}
              />
              <ErrorMessage error={errors.classCode} />
              <p className="text-xs text-gray-500">
                3-digit code to identify your class
              </p>
            </div>

            {/* Semester */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Semester <span className="text-red-500">*</span>
              </label>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.semester
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  >
                    <option value="">Select semester</option>
                    {CLASS_CONSTANTS.SEMESTERS.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                )}
              />
              <ErrorMessage error={errors.semester} />
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <Controller
                name="academicYear"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.academicYear
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  >
                    <option value="">Select academic year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}
              />
              <ErrorMessage error={errors.academicYear} />
            </div>

            {/* Max Students */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maximum Students <span className="text-red-500">*</span>
              </label>
              <Controller
                name="maxStudents"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <input
                    {...field}
                    type="number"
                    min={CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN}
                    max={CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX}
                    value={value || ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? null : Number(e.target.value);
                      onChange(val);
                    }}
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.maxStudents
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  />
                )}
              />
              <ErrorMessage error={errors.maxStudents} />
              <p className="text-xs text-gray-500">
                Range: {CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MIN} -{" "}
                {CLASS_CONSTANTS.LIMITS.MAX_STUDENTS_MAX} students
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Provide a brief description of the class..."
                    disabled={isLoading || isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-none ${
                      errors.description
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-emerald-500"
                    }`}
                  />
                )}
              />
              <ErrorMessage error={errors.description} />
              <p className="text-xs text-gray-500">
                Maximum {CLASS_CONSTANTS.LIMITS.DESCRIPTION_MAX} characters
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Advanced Settings
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Optional enrollment and status settings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              {showAdvancedSettings ? "Hide" : "Show"} Advanced
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              {/* Enrollment Key */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enrollment Key
                  <span className="text-xs text-gray-500 ml-1">
                    (Optional)
                  </span>
                </label>
                <Controller
                  name="enrollmentKey"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g., 123456"
                      maxLength={6}
                      disabled={isLoading || isSubmitting}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.enrollmentKey
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-300 focus:border-emerald-500"
                      }`}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                <ErrorMessage error={errors.enrollmentKey} />
                <p className="text-xs text-gray-500">
                  6-digit key for student enrollment (leave empty to
                  auto-generate)
                </p>
              </div>

              {/* Class Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Class Status
                </label>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-3 mt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isLoading || isSubmitting}
                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded disabled:cursor-not-allowed"
                      />
                      <label
                        htmlFor="isActive"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Active Class
                      </label>
                    </div>
                  )}
                />
                <p className="text-xs text-gray-500">
                  Inactive classes are hidden from students
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {isDirty && !isValid && (
              <span className="flex items-center text-amber-600">
                <svg
                  className="w-4 h-4 mr-1 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Please fix the errors above to continue
              </span>
            )}
            {isDirty && isValid && (
              <span className="flex items-center text-emerald-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Form is ready to submit
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !isValid}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-transparent rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 min-w-[140px] justify-center shadow-md"
            >
              {(isLoading || isSubmitting) && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>
                {isLoading || isSubmitting
                  ? mode === "create"
                    ? "Creating..."
                    : "Updating..."
                  : mode === "create"
                    ? "Create Class"
                    : "Update Class"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClassForm;
