"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "../_features/admin/AdminShell";

const students = [
  {
    id: "STU-1042",
    name: "Sopheak Mith",
    grade: "Grade 10",
    focus: "Physics",
    progress: 74,
    sessions: 18,
    status: "Active",
    lastSeen: "8 min ago",
  },
  {
    id: "STU-1087",
    name: "Vanna Rak",
    grade: "Grade 11",
    focus: "Math",
    progress: 61,
    sessions: 25,
    status: "Needs Review",
    lastSeen: "16 min ago",
  },
  {
    id: "STU-1131",
    name: "Leakena Chan",
    grade: "Grade 12",
    focus: "Chemistry",
    progress: 88,
    sessions: 31,
    status: "Active",
    lastSeen: "1 hour ago",
  },
  {
    id: "STU-1164",
    name: "Dara Sok",
    grade: "Grade 10",
    focus: "Physics",
    progress: 43,
    sessions: 9,
    status: "At Risk",
    lastSeen: "Yesterday",
  },
];

const grades = ["All Grades", "Grade 10", "Grade 11", "Grade 12"] as const;
const statuses = ["All Status", "Active", "Needs Review", "At Risk"] as const;

type Student = (typeof students)[number];

export default function StudentsPage() {
  const [gradeFilter, setGradeFilter] = useState<(typeof grades)[number]>("All Grades");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("All Status");

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (gradeFilter === "All Grades" || student.grade === gradeFilter) &&
          (statusFilter === "All Status" || student.status === statusFilter),
      ),
    [gradeFilter, statusFilter],
  );

  return (
    <AdminShell
      active="Students"
      title="Students"
      subtitle="Monitor and manage students who are using the app."
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Students" value="1,240" accent="+12% this month" />
        <MetricCard label="Active Today" value="326" accent="Live engagement" tone="cyan" />
        <MetricCard label="Avg. Progress" value="78%" accent="Across grades" tone="violet" />
        <MetricCard label="Need Review" value="24" accent="Teacher follow-up" tone="amber" />
      </div>

      <section className="mt-6 rounded-xl border border-[#243856] bg-[#0b1324] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
              Search Students
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                placeholder="Search by name or student ID..."
                className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] pl-11 pr-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
              />
            </div>
          </label>
          <SelectField
            label="Grade"
            value={gradeFilter}
            options={grades}
            onChange={(value) => setGradeFilter(value as (typeof grades)[number])}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            options={statuses}
            onChange={(value) =>
              setStatusFilter(value as (typeof statuses)[number])
            }
          />
        </div>
      </section>

      <StudentTable students={filteredStudents} />
    </AdminShell>
  );
}

function MetricCard({
  label,
  value,
  accent,
  tone = "blue",
}: {
  label: string;
  value: string;
  accent: string;
  tone?: "blue" | "cyan" | "violet" | "amber";
}) {
  const toneClass = {
    blue: "text-[#5368ff]",
    cyan: "text-[#1fc7e9]",
    violet: "text-[#7a4dff]",
    amber: "text-amber-300",
  }[tone];

  return (
    <article className="min-h-[132px] rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:border-[#35507a]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${toneClass}`}>{value}</p>
      <p className="mt-3 text-xs font-bold text-emerald-300">{accent}</p>
    </article>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function StudentTable({ students }: { students: Student[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
      <div className="border-b border-[#243856] px-6 py-5">
        <h2 className="text-lg font-extrabold text-white">Student Directory</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Review progress, sessions, and intervention status.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-[#101a2b] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-extrabold">Student</th>
              <th className="px-6 py-4 font-extrabold">Grade</th>
              <th className="px-6 py-4 font-extrabold">Focus</th>
              <th className="px-6 py-4 font-extrabold">Progress</th>
              <th className="px-6 py-4 font-extrabold">Sessions</th>
              <th className="px-6 py-4 font-extrabold">Status</th>
              <th className="px-6 py-4 text-right font-extrabold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243856]">
            {students.map((student) => (
              <tr key={student.id} className="text-sm transition hover:bg-[#101a2b]/55">
                <td className="px-6 py-5">
                  <p className="font-bold text-white">{student.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {student.id} · {student.lastSeen}
                  </p>
                </td>
                <td className="px-6 py-5 font-semibold text-slate-300">{student.grade}</td>
                <td className="px-6 py-5 font-semibold text-slate-300">{student.focus}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-[#101a2b]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#4367ff] to-[#1fc7e9]"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-300">
                      {student.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-[#1fc7e9]">{student.sessions}</td>
                <td className="px-6 py-5">
                  <StatusPill status={student.status} />
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="h-9 rounded-lg border border-[#243856] bg-[#101a2b] px-4 text-sm font-bold text-slate-300 transition hover:border-[#5368ff] hover:text-white">
                      View
                    </button>
                    <button className="h-9 rounded-lg border border-[#243856] bg-[#101a2b] px-4 text-sm font-bold text-slate-300 transition hover:border-rose-400 hover:text-rose-300">
                      Restrict
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#243856] px-6 py-4">
        <p className="text-xs font-semibold text-slate-600">
          Showing {students.length} students
        </p>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const classes =
    status === "Active"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "Needs Review"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-rose-500/15 text-rose-300";

  return (
    <span className={`inline-flex h-7 min-w-[96px] items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-extrabold ${classes}`}>
      {status}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}
