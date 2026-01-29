"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useJoinClass } from "../../hooks/queries/useClasses";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

const JoinClass = () => {
  const navigate = useNavigate();
  const { mutateAsync: joinClass, isPending } = useJoinClass();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await joinClass({ enrollmentKey: data.enrollmentKey });
      // Redirect to classes list or dashboard on success
      navigate("/app/classes");
    } catch (error) {
      console.error("Failed to join class:", error);
      // Optional: Set form error if specific field error returned
      if (error.response?.status === 404) {
        setError("enrollmentKey", {
          type: "manual",
          message: "Invalid enrollment key. Please check and try again.",
        });
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Join a Class</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the enrollment key provided by your teacher to join a new class.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="enrollmentKey" className="sr-only">
                Enrollment Key
              </label>
              <input
                id="enrollmentKey"
                type="text"
                maxLength={6}
                {...register("enrollmentKey", {
                  required: "Enrollment key is required",
                  minLength: {
                    value: 6,
                    message: "Key must be at least 6 characters",
                  },
                })}
                className={`appearance-none rounded-lg relative block w-full px-4 py-4 border ${
                  errors.enrollmentKey
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                } placeholder-gray-400 text-gray-900 text-lg tracking-widest text-center focus:outline-none focus:z-10 sm:text-sm shadow-sm transition-colors`}
                placeholder="Enter 6-digit Key"
              />
            </div>
            {errors.enrollmentKey && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {errors.enrollmentKey.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white ${
                isPending
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              } transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Joining...
                </>
              ) : (
                <>
                  Join Class
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;
