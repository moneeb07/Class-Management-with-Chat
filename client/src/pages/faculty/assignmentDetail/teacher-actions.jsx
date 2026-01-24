"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useUpdateAssignment } from "../../../hooks/queries/useClassAssignments";
import { useParams } from "react-router-dom";

export default function TeacherActions({ assignment, onSaved }) {
  const { classId, assignmentId } = useParams();

  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateAssignment, isLoading: isUpdating } =
    useUpdateAssignment(classId, assignmentId);

  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      description: assignment.description,
      dueDate: assignment.dueDate?.slice(0, 16), // yyyy-MM-ddTHH:mm
      totalMarks: assignment.totalMarks,
    },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      setError(null);
      await updateAssignment(values);
      setEditing(false);
      onSaved?.();
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Cancel Edit" : "Edit Assignment"}
        </button>
      </div>

      {editing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-3"
        >
          <div className="rounded-md border p-3 md:col-span-2">
            <label className="text-xs opacity-70">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              rows={4}
              {...register("description", { required: true })}
            />
            {formState.errors.description && (
              <p className="mt-1 text-xs text-red-600">Required</p>
            )}
          </div>
          <div className="grid gap-3">
            <div className="rounded-md border p-3">
              <label className="text-xs opacity-70">Due Date</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                {...register("dueDate", { required: true })}
              />
              {formState.errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">Required</p>
              )}
            </div>
            <div className="rounded-md border p-3">
              <label className="text-xs opacity-70">Total Marks</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                {...register("totalMarks", {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                })}
              />
              {formState.errors.totalMarks && (
                <p className="mt-1 text-xs text-red-600">
                  Enter a valid number
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="md:col-span-3 text-sm text-red-600">{error}</p>
          )}

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted"
              onClick={() => {
                reset();
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-md border p-3 text-sm">
          <p className="opacity-70">
            Use "Edit Assignment" to update description, due date, and total
            marks.
          </p>
        </div>
      )}
    </div>
  );
}
