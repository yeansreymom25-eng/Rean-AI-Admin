"use client";

import { useState } from "react";
import { CurriculumShell } from "./CurriculumShell";
import { grades } from "./data";
import { ActionButtons } from "./components/ActionButtons";
import {
  DataSurface,
  Drawer,
  DrawerActions,
  Field,
  StatusPill,
  StatusToggle,
  TextArea,
} from "./Shared";

type Grade = (typeof grades)[number] & { status?: string };
type GradeDrawerState =
  | { mode: "add"; grade?: undefined }
  | { mode: "edit" | "duplicate"; grade: Grade };

export function GradesPage() {
  const [gradeRows, setGradeRows] = useState<Grade[]>(
    grades.map((grade) => ({ ...grade, status: "Active" })),
  );
  const [drawerState, setDrawerState] = useState<GradeDrawerState | null>(null);

  function deactivateGrade(number: string) {
    setGradeRows((currentGrades) =>
      currentGrades.map((grade) =>
        grade.number === number ? { ...grade, status: "Inactive" } : grade,
      ),
    );
  }

  return (
    <CurriculumShell
      active="Grades"
      title="Grade Levels"
      subtitle="Organize academic years and educational tracks."
      searchPlaceholder="Search grade levels..."
      actionLabel="Add Grade Level"
      onAction={() => setDrawerState({ mode: "add" })}
    >
      <GradeTable
        grades={gradeRows}
        onEdit={(grade) => setDrawerState({ mode: "edit", grade })}
        onDuplicate={(grade) => setDrawerState({ mode: "duplicate", grade })}
        onDeactivate={deactivateGrade}
      />
      {drawerState && (
        <GradeModal state={drawerState} onClose={() => setDrawerState(null)} />
      )}
    </CurriculumShell>
  );
}

function GradeTable({
  grades,
  onEdit,
  onDuplicate,
  onDeactivate,
}: {
  grades: Grade[];
  onEdit: (grade: Grade) => void;
  onDuplicate: (grade: Grade) => void;
  onDeactivate: (number: string) => void;
}) {
  return (
    <DataSurface footer="Showing 1-3 of 12 grades">
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
          {grades.map((grade) => (
            <tr key={grade.number} className="text-sm transition hover:bg-[#101a2b]/55">
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
                {grade.description}
              </td>
              <td className="px-6 py-6">
                <StatusPill status={grade.status ?? "Active"} />
              </td>
              <td className="px-6 py-6 text-right">
                <ActionButtons
                  onEdit={() => onEdit(grade)}
                  onDuplicate={() => onDuplicate(grade)}
                  onDeactivate={() => onDeactivate(grade.number)}
                  deactivateLabel="Set inactive"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataSurface>
  );
}

function GradeModal({
  state,
  onClose,
}: {
  state: GradeDrawerState;
  onClose: () => void;
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

  return (
    <Drawer title={title} onClose={onClose}>
      <div className="space-y-5 p-6">
        <Field
          label="Grade Name"
          placeholder="e.g. Grade 12"
          defaultValue={
            state.mode === "duplicate" && grade
              ? `${grade.name} Copy`
              : grade?.name
          }
        />
        <p className="-mt-3 text-xs text-slate-600">
          Cambodian system equivalent: {grade?.name ?? "Grade 12"}
        </p>
        <Field
          label="Grade Number"
          placeholder="12"
          defaultValue={grade?.number}
        />
        <TextArea
          label="Description"
          placeholder="Briefly describe this grade level's focus..."
          defaultValue={grade?.description}
        />
        <StatusToggle />
      </div>
      <DrawerActions primaryLabel={primaryLabel} onClose={onClose} />
    </Drawer>
  );
}
