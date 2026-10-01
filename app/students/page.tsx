"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../_features/admin/AdminShell";
import {
  clearAdminSession,
  type AdminStudent,
  type AdminStudentsData,
  getAccessToken,
  loadAdminStudents,
} from "../_features/auth/adminAuth";
import { useRouter } from "next/navigation";

const grades = ["All Grades", "Grade 10", "Grade 11", "Grade 12"] as const;
const statuses = ["All Status", "Active", "Needs Review", "At Risk"] as const;

type Student = AdminStudent;

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

export default function StudentsPage() {
  const router = useRouter();
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [studentsData, setStudentsData] = useState<AdminStudentsData | null>(null);
  const [studentsError, setStudentsError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    loadAdminStudents()
      .then((data) => {
        setStudentsData(data);
        setStudentsError("");
      })
      .catch((error) => {
        if (isAuthExpiredError(error)) {
          clearAdminSession();
          router.replace("/auth/Login");
          return;
        }
        setStudentsError(error instanceof Error ? error.message : "Unable to load students");
      });
  }, [router]);

  const gradeOptions = studentsData?.filters.grades.length ? studentsData.filters.grades : [...grades];
  const statusOptions = studentsData?.filters.statuses.length ? studentsData.filters.statuses : [...statuses];

  const filteredStudents = useMemo(
    () =>
      (studentsData?.students ?? []).filter(
        (student) =>
          (gradeFilter === "All Grades" || student.grade === gradeFilter) &&
          (statusFilter === "All Status" || student.status === statusFilter) &&
          (`${student.name} ${student.id}`.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [gradeFilter, statusFilter, search, studentsData],
  );

  return (
    <AdminShell
      active="Students"
      title="Students"
      subtitle="Monitor and manage students who are using the app."
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Students"
          value={studentsData?.metrics.total_students.display ?? "0"}
          accent={studentsData?.metrics.total_students.accent ?? "No learners"}
        />
        <MetricCard
          label="Active Today"
          value={studentsData?.metrics.active_today.display ?? "0"}
          accent={studentsData?.metrics.active_today.accent ?? "No activity today"}
          tone="cyan"
        />
        <MetricCard
          label="Avg. Progress"
          value={studentsData?.metrics.average_progress.display ?? "0%"}
          accent={studentsData?.metrics.average_progress.accent ?? "No progress yet"}
          tone="violet"
        />
        <MetricCard
          label="Need Review"
          value={studentsData?.metrics.need_review.display ?? "0"}
          accent={studentsData?.metrics.need_review.accent ?? "No follow-up needed"}
          tone="amber"
        />
      </div>
      {studentsError && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
          {studentsError}
        </p>
      )}

      <section className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-fg">
              Search Students
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 pl-11 pr-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </label>
          <SelectField
            label="Grade"
            value={gradeFilter}
            options={gradeOptions}
            onChange={setGradeFilter}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
        </div>
      </section>

      <StudentTable
        students={filteredStudents}
        onView={(student) => router.push(`/ai_reviews?student=${encodeURIComponent(student.id)}`)}
        onRestrict={(student) =>
          router.push(`/ai_reviews?student=${encodeURIComponent(student.id)}&action=restrict`)
        }
      />
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
    blue: "text-brand",
    cyan: "text-info",
    violet: "text-brand-2",
    amber: "text-amber-300",
  }[tone];

  return (
    <article className="min-h-[132px] rounded-xl border border-line bg-surface p-6 shadow-card transition hover:border-line-strong">
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
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-fg">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-medium text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function StudentTable({
  students,
  onView,
  onRestrict,
}: {
  students: Student[];
  onView: (student: Student) => void;
  onRestrict: (student: Student) => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line px-6 py-5">
        <h2 className="text-lg font-extrabold text-fg">Student Directory</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Review progress, sessions, and intervention status.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-surface-2 text-xs uppercase text-slate-500">
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
          <tbody className="divide-y divide-line">
            {students.length ? (
              students.map((student) => (
              <tr key={student.id} className="text-sm transition hover:bg-surface-2/55">
                <td className="px-6 py-5">
                  <p className="font-bold text-fg">{student.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {student.id} · {student.lastSeen}
                  </p>
                </td>
                <td className="px-6 py-5 font-semibold text-slate-300">{student.grade}</td>
                <td className="px-6 py-5 font-semibold text-slate-300">{student.focus}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-info"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-300">
                      {student.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-info">{student.sessions}</td>
                <td className="px-6 py-5">
                  <StatusPill status={student.status} />
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onView(student)} className="h-9 rounded-lg border border-line bg-surface-2 px-4 text-sm font-bold text-slate-300 transition hover:border-brand hover:text-fg">
                      View
                    </button>
                    <button onClick={() => onRestrict(student)} className="h-9 rounded-lg border border-line bg-surface-2 px-4 text-sm font-bold text-slate-300 transition hover:border-rose-400 hover:text-rose-300">
                      Restrict
                    </button>
                  </div>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm font-semibold text-slate-500"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-6 py-4">
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
