"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CurriculumShell } from "./CurriculumShell";
import { grades, subjects } from "./data";
import { ActionButtons } from "./components/ActionButtons";
import { IconUploadField } from "./components/IconUploadField";
import {
  Drawer,
  StatusPill,
} from "./Shared";

type Subject = (typeof subjects)[number] & {
  grade: string;
};
type SubjectDrawerState =
  | { mode: "add"; subject?: undefined }
  | { mode: "edit" | "duplicate"; subject: Subject };

const gradeOptions = grades.map((grade) => grade.name);

const initialSubjects: Subject[] = [
  { ...subjects[0], grade: "Grade 12" },
  { ...subjects[1], grade: "Grade 12" },
  { ...subjects[2], grade: "Grade 11" },
];

export function SubjectsPage() {
  const [subjectRows, setSubjectRows] = useState<Subject[]>(initialSubjects);
  const [drawerState, setDrawerState] = useState<SubjectDrawerState | null>(null);
  const [selectedGrade, setSelectedGrade] = useState("Grade 12");

  const visibleSubjects = useMemo(
    () =>
      subjectRows.filter(
        (subject) => subject.grade === selectedGrade,
      ),
    [selectedGrade, subjectRows],
  );

  function deactivateSubject(code: string) {
    setSubjectRows((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.code === code && subject.grade === selectedGrade
          ? { ...subject, status: "Inactive" }
          : subject,
      ),
    );
  }

  function saveSubject(subject: Subject) {
    setSubjectRows((currentSubjects) => {
      if (drawerState?.mode === "edit") {
        return currentSubjects.map((currentSubject) =>
          currentSubject.code === drawerState.subject.code &&
          currentSubject.grade === drawerState.subject.grade
            ? subject
            : currentSubject,
        );
      }

      return [subject, ...currentSubjects];
    });

    setDrawerState(null);
  }

  return (
    <CurriculumShell
      active="Subjects"
      title="Subjects"
      subtitle="Choose a grade first, then add or manage subjects inside that grade."
      searchPlaceholder="Search subjects..."
      actionLabel="Add Subject"
      onAction={() => setDrawerState({ mode: "add" })}
    >
      <GradeContextBar
        value={selectedGrade}
        options={gradeOptions}
        onChange={setSelectedGrade}
      />
      <SubjectTable
        subjects={visibleSubjects}
        onEdit={(subject) => setDrawerState({ mode: "edit", subject })}
        onDuplicate={(subject) => setDrawerState({ mode: "duplicate", subject })}
        onDeactivate={deactivateSubject}
      />
      {drawerState && (
        <SubjectModal
          state={drawerState}
          selectedGrade={selectedGrade}
          onClose={() => setDrawerState(null)}
          onSave={saveSubject}
        />
      )}
    </CurriculumShell>
  );
}

function GradeContextBar({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <section className="mb-6 max-w-sm">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase text-[#7da6e6]">
          Grade Level
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-lg border border-[#35507a] bg-[#101a2b] px-4 text-sm font-extrabold text-white outline-none transition focus:border-[#5368ff]"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    </section>
  );
}

function SubjectSurface({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">{children}</div>

      <div className="flex items-center justify-between border-t border-[#243856] px-6 py-4">
        <p className="text-xs font-semibold text-slate-600">
          Showing {count} {count === 1 ? "subject" : "subjects"}
        </p>

        <span className="rounded-full border border-[#243856] bg-[#101a2b] px-3 py-1 text-[10px] font-extrabold uppercase text-slate-500">
          Grade scoped
        </span>
      </div>
    </section>
  );
}

function EmptySubjectsRow() {
  return (
    <tr>
      <td colSpan={8} className="px-6 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#35507a] bg-[#101a2b] text-lg font-black text-[#1fc7e9]">
            +
          </div>
          <p className="mt-4 text-sm font-extrabold text-white">
            No subjects in this grade yet
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use Add Subject to create the first subject for the selected grade.
          </p>
        </div>
      </td>
    </tr>
  );
}
function SubjectTable({
  subjects,
  onEdit,
  onDuplicate,
  onDeactivate,
}: {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDuplicate: (subject: Subject) => void;
  onDeactivate: (code: string) => void;
}) {
  return (
    <SubjectSurface count={subjects.length}>
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-[#101a2b] text-xs uppercase text-slate-500">
          <tr>
            <th className="px-6 py-4 font-extrabold">Icon</th>
            <th className="px-6 py-4 font-extrabold">Subject Name</th>
            <th className="px-6 py-4 font-extrabold">Grade</th>
            <th className="px-6 py-4 font-extrabold">Code</th>
            <th className="px-6 py-4 font-extrabold">Description</th>
            <th className="px-6 py-4 text-center font-extrabold">Order</th>
            <th className="px-6 py-4 font-extrabold">Status</th>
            <th className="px-6 py-4 text-right font-extrabold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#243856]">
          {subjects.map((subject) => (
            <tr key={subject.code} className="text-sm transition hover:bg-[#101a2b]/55">
              <td className="px-6 py-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#243856] bg-[#101a2b] text-xs font-extrabold text-[#1fc7e9]">
                  {subject.icon}
                </span>
              </td>
              <td className="px-6 py-6">
                <p className="font-bold text-white">{subject.name}</p>
                <p className="mt-1 text-xs text-slate-500">{subject.khmer}</p>
              </td>
              <td className="px-6 py-6 font-semibold text-slate-300">
                {subject.grade}
              </td>
              <td className="px-6 py-6">
                <span className="rounded-lg border border-[#243856] bg-[#101a2b] px-3 py-1.5 text-xs font-bold text-slate-300">
                  {subject.code}
                </span>
              </td>
              <td className="max-w-sm px-6 py-6 leading-6 text-slate-500">
                {subject.description}
              </td>
              <td className="px-6 py-6 text-center font-bold text-slate-300">
                {subject.order}
              </td>
              <td className="px-6 py-6">
                <StatusPill status={subject.status} />
              </td>
              <td className="px-6 py-6 text-right">
                <ActionButtons
                  onEdit={() => onEdit(subject)}
                  onDuplicate={() => onDuplicate(subject)}
                  onDeactivate={() => onDeactivate(subject.code)}
                  deactivateLabel="Set inactive"
                />
              </td>
            </tr>
          ))}
          {subjects.length === 0 && (
            <EmptySubjectsRow />
          )}
        </tbody>
      </table>
    </SubjectSurface>
  );
}

function SubjectModal({
  state,
  selectedGrade,
  onClose,
  onSave,
}: {
  state: SubjectDrawerState;
  selectedGrade: string;
  onClose: () => void;
  onSave: (subject: Subject) => void;
}) {
  const subject = state.subject;
  const isEditing = state.mode === "edit";
  const title =
    state.mode === "add"
      ? "Add Subject"
      : state.mode === "duplicate"
        ? "Duplicate Subject"
        : "Edit Subject";
  const primaryLabel = isEditing ? "Update Subject" : "Save Subject";
  const grade =
    isEditing && subject
      ? subject.grade
      : selectedGrade;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const code = String(formData.get("code") || "").trim();

    if (!name || !code) {
      return;
    }

    onSave({
      grade,
      name,
      khmer: subject?.khmer ?? name,
      code,
      icon: subject?.icon ?? code.slice(0, 2).toLowerCase(),
      description: String(formData.get("description") || "").trim(),
      order: String(formData.get("order") || "1"),
      status: formData.get("status") ? "Active" : "Draft",
    });
  }

  return (
    <Drawer title={title} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="space-y-5 p-6">
          <ReadOnlyField label="Grade Level" value={grade} />
          <NamedField
            name="name"
            label="Subject Name"
            placeholder="e.g. Physics"
            defaultValue={
              state.mode === "duplicate" && subject
                ? `${subject.name} Copy`
                : subject?.name
            }
          />
          <NamedField
            name="code"
            label="Subject Code"
            placeholder="e.g. PHYS"
            defaultValue={
              state.mode === "duplicate" && subject
                ? `${subject.code}_COPY`
                : subject?.code
            }
          />
          <IconUploadField />
          <NamedTextArea
            name="description"
            label="Description"
            placeholder="Briefly describe the key focus areas of this subject..."
            defaultValue={subject?.description}
          />
          <NamedField
            name="order"
            label="Display Order"
            placeholder="1"
            defaultValue={subject?.order}
          />
          <NamedStatusToggle defaultChecked={subject?.status !== "Draft"} />
        </div>
        <FormDrawerActions primaryLabel={primaryLabel} onClose={onClose} />
      </form>
    </Drawer>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-semibold text-cyan-300">
        {value}
      </div>
    </label>
  );
}

function NamedField({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <input
        name={name}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function NamedTextArea({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <textarea
        name={name}
        className="min-h-28 w-full resize-none rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function NamedStatusToggle({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[#3b5d8f] bg-[#101a2b] p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-50">Status</span>
        <span className="text-xs font-medium text-slate-400">
          Visible to students and teachers
        </span>
      </span>
      <input
        name="status"
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#5368ff]"
      />
    </label>
  );
}

function FormDrawerActions({
  primaryLabel,
  onClose,
}: {
  primaryLabel: string;
  onClose: () => void;
}) {
  return (
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
        className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
      >
        {primaryLabel}
      </button>
    </div>
  );
}
