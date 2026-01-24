import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCreateClass } from "../../hooks/queries/useClasses";
import ClassForm from "../../features/classes/ClassForm";

const CreateClass = () => {
  const navigate = useNavigate();
  const createClassMutation = useCreateClass();

  const handleSubmit = async (formData) => {
    try {
      const result = await createClassMutation.mutateAsync(formData);

      // Success feedback
      toast.success("Class created successfully!", {
        duration: 4000,
        position: "top-right",
      });

      // Navigate to created class or classes list
      navigate(`/app/classes/${result.data?.class?._id}` || "/classes");
      // navigate(`/app/classes/create`);

      console.log("Class created successfully:", result);
    } catch (error) {
      console.error("Error creating class:", error);

      // Additional toast for user feedback
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create class. Please try again.",
        {
          duration: 5000,
          position: "top-right",
        }
      );
    }
  };

  const handleCancel = () => {
    navigate("/classes");
  };

  const handleGoBack = () => {
    navigate(-1); // React Router equivalent of router.back()
  };

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleGoBack}
              disabled={createClassMutation.isPending}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-emerald-900">
                Create New Class
              </h1>
              <p className="text-emerald-700 mt-1">
                Set up a new class for your students
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-4 w-4 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <button
                    onClick={() => navigate("/app/classes")}
                    className="ml-4 text-green-600 hover:text-green-800 transition-colors"
                  >
                    Classes
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-4 w-4 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-4 text-green-800 font-medium">
                    Create Class
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Form */}
        <ClassForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createClassMutation.isPending}
          mutationError={createClassMutation.error}
          mode="create"
        />

        {/* Loading Overlay */}
        {createClassMutation.isPending && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg
                    className="animate-spin h-8 w-8 text-green-600"
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
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800">
                    Creating Class
                  </h3>
                  <p className="text-sm text-green-600">
                    Please wait while we set up your new class...
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-green-600 mb-1">
                  <span>Processing</span>
                  <span>Please wait...</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateClass;
