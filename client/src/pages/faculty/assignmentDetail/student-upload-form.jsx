import { useForm } from "react-hook-form";
import { useState, useCallback } from "react";
import { api } from "../../../api/axiosConfig";

function extFromName(name) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export default function StudentUploadForm({
  classId,
  assignmentId,
  canSubmit,
  isOverdue,
  maxAttempts,
  allowedFileTypes,
  maxFileSizeMB,
  maxFiles,
  onSubmitted,
}) {
  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: { text: "", honor: false },
  });
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const validateFiles = useCallback(
    (incoming) => {
      const next = [...files, ...incoming];
      if (next.length > maxFiles) {
        setError(`You can upload up to ${maxFiles} file(s).`);
        return null;
      }
      for (const f of incoming) {
        const ext = extFromName(f.name);
        if (!allowedFileTypes.includes(ext)) {
          setError(
            `File type .${ext || "unknown"} is not allowed. Allowed: ${allowedFileTypes.join(", ")}`
          );
          return null;
        }
        if (f.size / (1024 * 1024) > maxFileSizeMB) {
          setError(`"${f.name}" exceeds the ${maxFileSizeMB} MB limit.`);
          return null;
        }
      }
      setError(null);
      return next;
    },
    [files, allowedFileTypes, maxFileSizeMB, maxFiles]
  );

  const onDrop = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragActive(false);
    const incoming = Array.from(ev.dataTransfer.files || []);
    const next = validateFiles(incoming);
    if (next) setFiles(next);
  };

  const onFileInput = (ev) => {
    const incoming = Array.from(ev.target.files || []);
    const next = validateFiles(incoming);
    if (next) setFiles(next);
  };

  const removeFile = (i) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (values) => {
    if (!canSubmit) {
      setError("Submissions are closed.");
      return;
    }
    if (files.length === 0) {
      setError("Please attach at least one file.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("text", values.text);
      fd.append("honor", String(values.honor));
      files.forEach((f) => fd.append("files", f));

      // ✅ Axios POST request
      const res = await api.post(
        `/classes/${classId}/assignments/${assignmentId}/submit`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // ✅ Axios automatically parses JSON
      console.log("Submission success:", res.data);

      reset();
      setFiles([]);
      setError(null);
      onSubmitted?.();
    } catch (e) {
      // Axios errors have a different shape than fetch errors
      const msg =
        e.response?.data?.message || e.message || "Submission failed.";
      setError(msg);
    }
  };

  return (
    <div className="mt-3">
      {!canSubmit && (
        <p className="mb-3 text-sm text-red-600">
          You cannot submit at this time.
        </p>
      )}
      {isOverdue && (
        <p className="mb-3 text-sm text-red-600">
          This assignment is overdue. Late penalties may apply.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={onDrop}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
            dragActive ? "border-blue-500 bg-gray-100" : "border-gray-300"
          }`}
          aria-label="File dropzone"
        >
          <p className="text-sm">Drag & drop your files here</p>
          <p className="text-xs opacity-70">or</p>
          <div className="mt-2">
            <label className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:opacity-90">
              Choose files
              <input
                type="file"
                multiple
                onChange={onFileInput}
                className="sr-only"
                accept={allowedFileTypes.map((e) => "." + e).join(",")}
              />
            </label>
          </div>
          <p className="mt-2 text-xs opacity-70">
            Allowed: {allowedFileTypes.join(", ")} • Max size: {maxFileSizeMB}{" "}
            MB • Max files: {maxFiles}
          </p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-md border bg-gray-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{f.name}</p>
                  <p className="text-xs opacity-70">
                    {(f.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-200"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Extra Fields */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <label className="text-xs opacity-70">
              text to Teacher (optional)
            </label>
            <textarea
              className="mt-1 w-full rounded-md border bg-white p-2 text-sm"
              rows={3}
              placeholder="Anything you want to mention about your submission"
              {...register("text")}
            />
          </div>
          <div className="rounded-md border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                {...register("honor", { required: true })}
              />
              I confirm this work is my own.
            </label>
            {formState.errors.honor && (
              <p className="mt-1 text-xs text-red-600">
                You must confirm academic honesty.
              </p>
            )}
            <p className="mt-2 text-xs opacity-70">
              Attempts allowed: {maxAttempts}
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit || formState.isSubmitting}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            {formState.isSubmitting ? "Submitting…" : "Submit Assignment"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFiles([]);
              reset();
              setError(null);
            }}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
