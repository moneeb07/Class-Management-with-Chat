
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { classAssignmentApi } from "../../api/classAssignmentApi";
import { format } from "date-fns";
// No custom table components available, using standard HTML/Tailwind
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../../components/ui/table";

export default function TeacherSubmissionsList() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Fetch submissions
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["submissions", classId, assignmentId],
    queryFn: () => classAssignmentApi.getSubmissions(classId, assignmentId),
  });

  // Fetch assignment details for context
  const { data: assignmentData } = useQuery({
    queryKey: ["assignment", classId, assignmentId],
    queryFn: () => classAssignmentApi.getClassAssignment(classId, assignmentId),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading submissions...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading submissions: {error.message}</div>;

  const submissions = response?.data || [];
  const assignment = assignmentData;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <button 
             onClick={() => navigate(`/app/classes/${classId}/assignments/${assignmentId}`)}
             className="text-sm text-blue-600 hover:underline mb-2"
           >
             &larr; Back to Assignment
           </button>
           <h1 className="text-2xl font-bold">Submissions: {assignment?.title}</h1>
           <p className="text-gray-500 text-sm">Total Submissions: {response?.total || submissions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Submitted At</th>
                <th className="px-6 py-3">Grade</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No submissions found yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {sub.student?.fullName || "Unknown Student"}
                      <div className="text-xs text-gray-500">{sub.student?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
                        ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : 
                          sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                      {sub.isLate && (
                        <span className="ml-2 inline-flex px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Late</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {sub.submittedAt ? format(new Date(sub.submittedAt), "MMM d, yyyy h:mm a") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {sub.grade !== undefined ? (
                        <span className="font-semibold">{sub.grade} / {assignment?.totalMarks}</span>
                      ) : (
                        <span className="text-gray-400 italic">Not Graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Placeholder for future grading interface link */}
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => navigate(`/app/classes/${classId}/assignments/${assignmentId}/grade`, { state: { submissionId: sub._id } })}
                      >
                         {sub.status === 'graded' ? 'Review Grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
