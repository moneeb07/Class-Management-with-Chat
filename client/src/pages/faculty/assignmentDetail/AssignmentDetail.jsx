import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import StudentUploadForm from "./student-upload-form";
import TeacherActions from "./teacher-actions";
import {
  useDownloadAssignmentZip,
  useGetAssignment,
} from "../../../hooks/queries/useClassAssignments";
import { useParams } from "react-router-dom";

function Chip({ children, color = "default" }) {
  const map = {
    default: "bg-muted text-foreground",
    green:
      "bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-foreground)] border border-[color:var(--color-border)]",
    red: "bg-[oklch(0.98_0.02_25)] text-[oklch(0.5_0.15_25)] border border-[color:var(--color-border)]",
    yellow:
      "bg-[oklch(0.98_0.03_90)] text-[oklch(0.55_0.12_90)] border border-[color:var(--color-border)]",
    blue: "bg-[oklch(0.98_0.03_240)] text-[oklch(0.5_0.12_240)] border border-[color:var(--color-border)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
}

export default function AssignmentDetail({ role }) {
  const navigate = useNavigate();
  const { classId, assignmentId } = useParams();
  const {
    data: a,
    isLoading,
    error,
    isFetching,
    refetch,
    isError,
  } = useGetAssignment(classId, assignmentId);
  const { mutate: downloadZip } = useDownloadAssignmentZip();
  console.log(a);

  if (isLoading)
    return <div className="text-sm opacity-70">Loading assignment…</div>;
  if (isError)
    return (
      <div className="text-sm text-red-600">Failed to load assignment.</div>
    );
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border bg-card shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-balance">{a.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip color="blue">
                Class: {a.class.className} ({a.class.classCode})
              </Chip>
              <Chip color="green">
                Teacher: {a.teacher.firstName} {a.teacher.lastName}
              </Chip>
              <Chip color={a.isOverdue ? "red" : "yellow"}>
                {a.isOverdue
                  ? "Overdue"
                  : `Due: ${format(new Date(a.dueDate), "PPpp")}`}
              </Chip>
              {role === "student" && a.timeRemaining && !a.isOverdue && (
                <Chip color="green">Time Remaining: {a.timeRemaining}</Chip>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/")}
              aria-label="Back to Home"
            >
              Home
            </button>
            {role === "teacher" && (
              <button
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted"
                onClick={() => navigate(`/app/classes/${classId}/assignments/${a._id}/submissions`)}
              >
                View All Submissions
              </button>
            )}
          </div>
        </div>

        {/* Description + Instructions */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Description</h2>
            <p className="mt-2 text-sm leading-relaxed">{a.description}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Instructions</h2>
            <p className="mt-2 text-sm leading-relaxed">{a.instructions}</p>
          </div>
        </div>

        {/* Attachments */}
        {a.uploadedFiles?.length ? (
          <div className="mt-4 rounded-lg border p-4">
            <h3 className="font-medium">Attached Files</h3>
            <ul className="mt-2 space-y-2">
              {a.uploadedFiles.map((f) => (
                <li
                  key={f._id}
                  className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{f.originalName}</p>
                    <p className="text-xs opacity-70">
                      {(f.size / 1024).toFixed(0)} KB • {f.mimeType}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      downloadZip({
                        classId,
                        assignmentId,
                        filename: f.filename,
                      })
                    }
                    disabled={!classId || !assignmentId}
                    className="text-sm text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Settings summary */}
      <section className="rounded-lg border bg-card shadow-sm p-5">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs opacity-70">Late Submission</p>
            <p className="text-sm">
              {a.allowLateSubmission
                ? `Allowed (-${a.latePenaltyPercentage}%/day)`
                : "Not allowed"}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs opacity-70">Total Marks</p>
            <p className="text-sm">{a.totalMarks}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs opacity-70">File Types</p>
            <p className="text-sm">{a.allowedFileTypes.join(", ")}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs opacity-70">Max File Size</p>
            <p className="text-sm">{a.maxFileSize} MB</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs opacity-70">Max Files</p>
            <p className="text-sm">{a.maxFiles}</p>
          </div>
        </div>
      </section>

      {/* Role-based Actions */}
      {role === "student" ? (
        <section className="rounded-lg border bg-card shadow-sm p-5">
          <h2 className="text-lg font-semibold">Your Submission</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip color="default">
              Status: {a.userSubmission?.status ?? "not submitted"}
            </Chip>
            {a.userSubmission?.grade != null && (
              <Chip color="green">
                Grade: {a.userSubmission.grade}/{a.totalMarks}
              </Chip>
            )}
          </div>
          <StudentUploadForm
            assignmentId={a._id}
            classId={classId}
            canSubmit={!!a.canSubmit}
            isOverdue={!!a.isOverdue}
            maxAttempts={a.maxAttempts}
            allowedFileTypes={a.allowedFileTypes}
            maxFileSizeMB={a.maxFileSize}
            maxFiles={a.maxFiles}
            onSubmitted={() => refetch()}
          />
        </section>
      ) : (
        <section className="rounded-lg border bg-card shadow-sm p-5">
          <TeacherActions
            assignment={a}
            onSaved={() => {
              refetch();
            }}
          />
        </section>
      )}

      {/* Stats for teacher */}
      {role === "teacher" && a.statistics && (
        <section className="rounded-lg border bg-card shadow-sm p-5">
          <h2 className="text-lg font-semibold">Statistics</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border p-3">
              <p className="text-xs opacity-70">Total Submissions</p>
              <p className="text-xl font-semibold">
                {a.statistics.totalSubmissions}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs opacity-70">Average Grade</p>
              <p className="text-xl font-semibold">
                {a.statistics.averageGrade}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs opacity-70">Completion Rate</p>
              <p className="text-xl font-semibold">
                {a.statistics.completionRate}%
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs opacity-70">Last Updated</p>
              <p className="text-sm">
                {format(new Date(a.statistics.lastCalculated), "PPpp")}
              </p>
            </div>
          </div>
          {a.submissionStats && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {Object.entries(a.submissionStats).map(([k, v]) => (
                <div key={k} className="rounded-md border p-3">
                  <p className="text-xs opacity-70 capitalize">{k}</p>
                  <p className="text-lg font-semibold">{v}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
