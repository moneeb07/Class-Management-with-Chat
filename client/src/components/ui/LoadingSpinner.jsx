function LoadingSpinner({ text }) {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-green-700">Loading {text} </p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
