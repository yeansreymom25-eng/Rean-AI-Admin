"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminSession,
  createAdminGrade,
  getAccessToken,
  loadAdminGrades,
  updateAdminGrade,
  type AdminGradeLevel,
  type AdminGradeStatus,
} from "../auth/adminAuth";
import { CurriculumShell } from "./CurriculumShell";
import { ActionButtons } from "./components/ActionButtons";
import { DataSurface, Drawer, StatusPill } from "./Shared";

type Grade = AdminGradeLevel;
type GradeDrawerState =
  | { mode: "add"; grade?: undefined }
  | { mode: "edit" | "duplicate"; grade: Grade };

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

export function GradesPage() {
  const router = useRouter();
  const [gradeRows, setGradeRows] = useState<Grade[]>([]);
  const [drawerState, setDrawerState] = useState<GradeDrawerState | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    loadGrades();
  }, [router]);

  async function loadGrades() {
    setIsLoading(true);
    setError("");
    try {
      setGradeRows(await loadAdminGrades());
    } catch (loadError) {
      if (isAuthExpiredError(loadError)) {
        clearAdminSession();
        router.replace("/auth/Login");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Unable to load grades");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveGrade(payload: {
    name: string;
    number: string;
    description: string;
    status: AdminGradeStatus;
  }) {
    if (!drawerState) return;

    setError("");
    setMessage("");
    const savedGrade =
      drawerState.mode === "edit"
        ? await updateAdminGrade(drawerState.grade.grade_level_id, payload)
        : await createAdminGrade(payload);

    setGradeRows((currentGrades) => {
      const withoutSaved = currentGrades.filter(
        (grade) => grade.grade_level_id !== savedGrade.grade_level_id,
      );
      return [...withoutSaved, savedGrade].sort(
        (left, right) => Number(right.number) - Number(left.number),
      );
    });
    setDrawerState(null);
    setMessage(
      drawerState.mode === "edit"
        ? "Grade level updated successfully."
        : "Grade level added successfully.",
    );
  }

  async function deactivateGrade(grade: Grade) {
    setError("");
    setMessage("");
    try {
      const updatedGrade = await updateAdminGrade(grade.grade_level_id, {
        status: "Inactive",
      });
      setGradeRows((currentGrades) =>
        currentGrades.map((item) =>
          item.grade_level_id === updatedGrade.grade_level_id ? updatedGrade : item,
        ),
      );
      setMessage("Grade level set to inactive.");
    } catch (deactivateError) {
      if (isAuthExpiredError(deactivateError)) {
        clearAdminSession();
        router.replace("/auth/Login");
        return;
      }
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : "Unable to update grade status",
      );
    }
  }

  const filteredGrades = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return gradeRows;
    return gradeRows.filter((grade) =>
      [grade.name, grade.khmer, grade.number, grade.description, grade.status]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [gradeRows, search]);

  return (
    <CurriculumShell
      active="Grades"
      title="Grade Levels"
      subtitle="Organize academic years and educational tracks."
      searchPlaceholder="Search grade levels..."
      searchValue={search}
      onSearchChange={setSearch}
      actionLabel="Add Grade Level"
      onAction={() => setDrawerState({ mode: "add" })}
    >
      {message && (
        <p className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200">
          {error}
        </p>
      )}
      <GradeTable
        grades={filteredGrades}
        totalCount={gradeRows.length}
        isLoading={isLoading}
        onEdit={(grade) => setDrawerState({ mode: "edit", grade })}
        onDuplicate={(grade) => setDrawerState({ mode: "duplicate", grade })}
        onDeactivate={deactivateGrade}
      />
      {drawerState && (
        <GradeModal
          state={drawerState}
          onClose={() => setDrawerState(null)}
          onSave={saveGrade}
          onError={(nextError) => setError(nextError)}
        />
      )}
    </CurriculumShell>
  );
}

function GradeTable({
  grades,
  totalCount,
  isLoading,
  onEdit,
  onDuplicate,
  onDeactivate,
}: {
  grades: Grade[];
  totalCount: number;
  isLoading: boolean;
  onEdit: (grade: Grade) => void;
  onDuplicate: (grade: Grade) => void;
  onDeactivate: (grade: Grade) => void;
}) {
  const footer = isLoading
    ? "Loading grade levels..."
    : `Showing ${grades.length ? `1-${grades.length}` : "0"} of ${totalCount} grades`;

  return (
    <DataSurface footer={footer}>
      <table className="w-full min-w-[840px] text-left">
        <thead className="bg-[#101a2b] text-xs uppercase text-slate-500">
          <tr>
            <th className="px-6 py-4 font-extrabold">Grade Name</th>
            <th className="px-6 py-4 font-extrabold">Grade Number</th>
            <th className="px-6 py-4 font-extrabold">Description</th>
            <th className="px-6 py-4 font-extrabold">Status</th>
            <th className="px-6 py-4 text-right font-extrabold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#243856]">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                Loading grade levels...
              </td>
            </tr>
          ) : grades.length ? (
            grades.map((grade) => (
              <tr key={grade.grade_level_id} className="text-sm transition hover:bg-[#101a2b]/55">
                <td className="px-6 py-6">
                  <p className="font-bold text-white">{grade.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{grade.khmer}</p>
                </td>
                <td className="px-6 py-6">
                  <span className="rounded-lg border border-[#243856] bg-[#101a2b] px-3 py-1.5 text-xs font-bold text-slate-300">
                    {grade.number}
                  </span>
                </td>
                <td className="max-w-xl px-6 py-6 leading-6 text-slate-500">
                  {grade.description || "No description yet"}
                </td>
                <td className="px-6 py-6">
                  <StatusPill status={grade.status} />
                </td>
                <td className="px-6 py-6 text-right">
                  <ActionButtons
                    onEdit={() => onEdit(grade)}
                    onDuplicate={() => onDuplicate(grade)}
                    onDeactivate={() => onDeactivate(grade)}
                    deactivateLabel="Set inactive"
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                No grade levels found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </DataSurface>
  );
}

function GradeModal({
  state,
  onClose,
  onSave,
  onError,
}: {
  state: GradeDrawerState;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    number: string;
    description: string;
    status: AdminGradeStatus;
  }) => Promise<void>;
  onError: (error: string) => void;
}) {
  const grade = state.grade;
  const isEditing = state.mode === "edit";
  const title =
    state.mode === "add"
      ? "Add Grade Level"
      : state.mode === "duplicate"
        ? "Duplicate Grade Level"
        : "Edit Grade Level";
  const primaryLabel = isEditing ? "Update Grade Level" : "Save Grade Level";
  const [name, setName] = useState(
    state.mode === "duplicate" && grade ? `${grade.name} Copy` : grade?.name ?? "",
  );
  const [number, setNumber] = useState(
    state.mode === "duplicate" ? "" : grade?.number ?? "",
  );
  const [description, setDescription] = useState(grade?.description ?? "");
  const [status, setStatus] = useState<AdminGradeStatus>(grade?.status ?? "Active");
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    onError("");

    if (!name.trim()) {
      setLocalError("Grade name is required.");
      return;
    }
    if (!number.trim() || Number.isNaN(Number(number))) {
      setLocalError("Grade number is required.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        number: number.trim(),
        description: description.trim(),
        status,
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to save grade level";
      setLocalError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-5 p-6">
          {localError && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {localError}
            </p>
          )}
          <FormField
            label="Grade Name"
            placeholder="e.g. Grade 12"
            value={name}
            onChange={setName}
          />
          <p className="-mt-3 text-xs text-slate-600">
            Cambodian system equivalent: {name || "Grade 12"}
          </p>
          <FormField
            label="Grade Number"
            placeholder="12"
            value={number}
            onChange={setNumber}
          />
          <FormTextArea
            label="Description"
            placeholder="Briefly describe this grade level's focus..."
            value={description}
            onChange={setDescription}
          />
          <label className="flex items-center justify-between rounded-lg border border-[#3b5d8f] bg-[#101a2b] p-4">
            <span>
              <span className="block text-sm font-semibold text-slate-50">Status</span>
              <span className="text-xs font-medium text-slate-400">
                Visible to students and teachers
              </span>
            </span>
            <input
              type="checkbox"
              checked={status === "Active"}
              onChange={(event) => setStatus(event.target.checked ? "Active" : "Inactive")}
              className="h-4 w-4 accent-[#5368ff]"
            />
          </label>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-[#3b5d8f] bg-[#101a2b] text-sm font-bold text-slate-100 transition hover:border-[#6f7cff] hover:bg-[#0b1324]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : primaryLabel}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FormTextArea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <textarea
        className="min-h-28 w-full resize-none rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
