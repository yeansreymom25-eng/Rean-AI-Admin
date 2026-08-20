"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  adminLogout,
  clearAdminSession,
  type AdminDashboardData,
  type DashboardNotification,
  type CurriculumStatusItem,
  type FlaggedAiSession,
  getAccessToken,
  loadAdminDashboard,
  type StudentActivityPoint,
} from "../_features/auth/adminAuth";
import { curriculumLinks } from "../_features/curriculum/data";

const loadingStats = [
  {
    label: "Total Students",
    value: "...",
    accent: "Fetching backend data",
    icon: "students",
    color: "text-[#5368ff]",
  },
  {
    label: "Active AI Sessions",
    value: "...",
    accent: "Fetching backend data",
    icon: "AI",
    color: "text-[#1fc7e9]",
  },
  {
    label: "Curriculum Progress",
    value: "...",
    accent: "Fetching backend data",
    icon: "%",
    color: "text-[#7a4dff]",
  },
  {
    label: "AI Quality Score",
    value: "...",
    accent: "Fetching backend data",
    icon: "quality",
    color: "text-emerald-300",
  },
];

type Session = FlaggedAiSession;
const DASHBOARD_CACHE_KEY = "rean_admin_dashboard_cache_v2";

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [range, setRange] = useState<"7" | "30">("7");
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Amber" | "Red">("All");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [page, setPage] = useState(1);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    const cachedDashboard = readCachedDashboard();
    if (cachedDashboard) {
      setDashboardData(cachedDashboard);
    }

    loadAdminDashboard()
      .then((data) => {
        setDashboardData(data);
        storeCachedDashboard(data);
        setDashboardError("");
      })
      .catch((error) => {
        if (isAuthExpiredError(error)) {
          clearAdminSession();
          router.replace("/auth/Login");
          return;
        }
        setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard");
      });
  }, [router]);

  const admin = dashboardData?.admin;
  const adminName = admin?.full_name || "Admin";
  const adminRole = admin?.role === "administrator" ? "Administrator" : "Admin";
  const adminPhoto = admin?.profile_image_url || null;
  const adminInitials = adminName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const stats = buildStats(dashboardData);
  const sessions = dashboardData?.insights.flagged_ai_sessions ?? [];
  const notifications = dashboardData?.insights.notifications ?? [];

  const filteredSessions = useMemo(
    () =>
      sessions.filter(
        (session) => statusFilter === "All" || session.status === statusFilter,
      ),
    [statusFilter],
  );
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleSessions = filteredSessions.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function changeStatusFilter(nextStatus: "All" | "Amber" | "Red") {
    setStatusFilter(nextStatus);
    setPage(1);
  }

  async function handleSignOut() {
    await adminLogout();
    router.replace("/auth/Login");
  }

  return (
    <main className="min-h-screen bg-[#070b19] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-[#243856] bg-[#070b19] px-6 py-7 lg:flex lg:flex-col">
          <Brand />

          <nav className="mt-10 space-y-2">
            <Link
              href="/admin_dashboard"
              className="flex h-11 w-full items-center gap-4 rounded-xl bg-gradient-to-r from-[#4367ff] to-[#7a4dff] px-4 text-left text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition"
            >
              <SidebarIcon name="dashboard" />
              Dashboard
            </Link>

            <div>
              <button
                type="button"
                onClick={() => setIsCurriculumOpen((isOpen) => !isOpen)}
                className="flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold text-slate-500 transition hover:bg-[#101a2b] hover:text-slate-200"
                aria-expanded={isCurriculumOpen}
              >
                <SidebarIcon name="curriculum" />
                Curriculum
                <span className={`ml-auto flex h-5 w-5 items-center justify-center text-[#7da6e6] transition-transform ${isCurriculumOpen ? "rotate-180" : "rotate-0"}`}>
                  <ChevronDownIcon />
                </span>
              </button>
              {isCurriculumOpen && (
                <div className="space-y-2 px-4 pb-4 pl-[60px]">
                  {curriculumLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex h-11 w-full items-center rounded-lg px-4 text-sm font-bold text-[#6f89b4] transition hover:bg-[#101a2b] hover:text-slate-200"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/students"
              className="flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold text-slate-500 transition hover:bg-[#101a2b] hover:text-slate-200"
            >
              <SidebarIcon name="students" />
              Students
            </Link>
            <Link
              href="/settings"
              className="flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold text-slate-500 transition hover:bg-[#101a2b] hover:text-slate-200"
            >
              <SidebarIcon name="settings" />
              Settings
            </Link>
          </nav>

          <div className="mt-auto">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold">
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={`${adminName} admin profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  adminInitials || "A"
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{adminName}</p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-[#243856] bg-[#0b1324] px-5 md:px-10">
            <div className="flex min-w-0 items-center gap-3 text-sm font-semibold">
              <Image
                src="/AI Tutor_Logo.png"
                alt="Rean AI logo"
                width={42}
                height={42}
                className="h-10 w-10 object-contain lg:hidden"
                priority
              />
              <span className="hidden text-slate-500 sm:inline">Admin</span>
              <span className="hidden text-slate-600 sm:inline">/</span>
              <span className="text-slate-200">Dashboard</span>
            </div>

            <div className="relative flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
                className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-[#243856] bg-[#101a2b] text-[#7da6e6] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:border-[#5368ff] hover:text-white sm:flex"
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
              >
                <NotificationIcon />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#5368ff]" />
                )}
              </button>
              {isNotificationsOpen && (
                <NotificationsPanel
                  notifications={notifications}
                  onClose={() => setIsNotificationsOpen(false)}
                />
              )}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-white">{adminName}</p>
                <p className="text-xs text-slate-500">{adminRole}</p>
              </div>
              <div
                aria-label={`${adminName} admin profile`}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#5368ff] bg-gradient-to-br from-[#4367ff] to-[#7a4dff] text-sm font-extrabold text-white"
              >
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={`${adminName} admin profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  adminInitials || "A"
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 md:px-8 lg:py-12">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Dashboard Overview
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Monitor students, curriculum coverage, and AI review queues.
                </p>
              </div>

              <div className="flex w-fit rounded-xl border border-[#243856] bg-[#0b1324] p-1">
                <RangeButton active={range === "7"} onClick={() => setRange("7")}>
                  Last 7 Days
                </RangeButton>
                <RangeButton active={range === "30"} onClick={() => setRange("30")}>
                  Last 30 Days
                </RangeButton>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.label} stat={stat} range={range} />
              ))}
            </div>
            {dashboardError && (
              <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
                {dashboardError}
              </p>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
              <StudentActivityCard
                range={range}
                points={
                  range === "7"
                    ? dashboardData?.insights.student_activity.last_7_days
                    : dashboardData?.insights.student_activity.last_30_days
                }
              />
              <CurriculumStatusCard
                overallProgress={
                  dashboardData?.insights.curriculum_status.overall_progress
                }
                subjects={dashboardData?.insights.curriculum_status.subjects}
              />
            </div>

            <SessionTable
              sessions={visibleSessions}
              count={filteredSessions.length}
              page={safePage}
              totalPages={totalPages}
              statusFilter={statusFilter}
              onStatusFilterChange={changeStatusFilter}
              onPageChange={setPage}
              onOpen={setSelectedSession}
            />
          </div>
        </section>
      </div>

      {selectedSession && (
        <SessionDrawer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/AI Tutor_Logo.png"
        alt="Rean AI logo"
        width={50}
        height={50}
        className="h-12 w-12 object-contain"
        priority
      />
      <span className="text-xl font-bold tracking-tight text-white">Rean AI</span>
    </div>
  );
}

function readCachedDashboard(): AdminDashboardData | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { expiresAt: number; data: AdminDashboardData };
    if (parsed.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
    return null;
  }
}

function storeCachedDashboard(data: AdminDashboardData): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    DASHBOARD_CACHE_KEY,
    JSON.stringify({
      expiresAt: Date.now() + 20_000,
      data,
    }),
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function buildStats(data: AdminDashboardData | null) {
  if (!data) return loadingStats;

  return [
    {
      ...loadingStats[0],
      value: data.metrics.total_students.display,
      accent: data.metrics.total_students.accent,
    },
    {
      ...loadingStats[1],
      value: data.metrics.active_ai_sessions.display,
      accent: data.metrics.active_ai_sessions.accent,
    },
    {
      ...loadingStats[2],
      value: data.metrics.curriculum_progress.display,
      accent: data.metrics.curriculum_progress.accent,
    },
    {
      ...loadingStats[3],
      value: data.metrics.ai_quality_score.display,
      accent: data.metrics.ai_quality_score.accent,
    },
  ];
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
          : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  stat,
  range,
}: {
  stat: (typeof loadingStats)[number];
  range: "7" | "30";
}) {
  return (
    <article className="min-h-[142px] rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:border-[#35507a]">
      <div className="mb-5 flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#243856] bg-[#101a2b] text-sm font-extrabold ${stat.color}`}
        >
          <StatIcon name={stat.icon} />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            stat.accent.includes("+") ||
            stat.accent.includes("Live") ||
            stat.accent.includes("Excellent")
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-[#101a2b] text-slate-500"
          }`}
        >
          {range === "7" ? stat.accent : stat.accent.replace("month", "30 days")}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{stat.value}</p>
    </article>
  );
}

function StatIcon({ name }: { name: string }) {
  if (name === "students") {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M5.5 19.5a6.5 6.5 0 0 1 13 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "quality") {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 3.75 18.25 6v5.25c0 4.05-2.52 7.68-6.25 9-3.73-1.32-6.25-4.95-6.25-9V6L12 3.75Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m9.25 12.1 1.85 1.85 3.9-4.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return <span>{name}</span>;
}

function StudentActivityCard({
  range,
  points,
}: {
  range: "7" | "30";
  points?: StudentActivityPoint[];
}) {
  const fallback =
    range === "7"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
          label,
          value: 0,
        }))
      : ["W1", "W2", "W3", "W4", "Now"].map((label) => ({ label, value: 0 }));
  const chartPoints = points?.length ? points : fallback;
  const maxValue = Math.max(1, ...chartPoints.map((point) => point.value));
  const coordinates = chartPoints.map((point, index) => {
    const x =
      chartPoints.length === 1 ? 320 : (index / (chartPoints.length - 1)) * 640;
    const y = 205 - (point.value / maxValue) * 165;
    return { x, y };
  });
  const linePath = coordinates
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L640 245 L0 245 Z`;
  const yAxis = [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25)];

  return (
    <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">Student Activity</h2>
        <span className="rounded-full bg-[#101a2b] px-3 py-1 text-xs font-bold text-slate-500">
          {range === "7" ? "Weekly Engagement" : "Monthly Engagement"}
        </span>
      </div>

      <div className="relative h-[255px] overflow-hidden rounded-lg border border-[#243856] bg-[#070b19]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(83,104,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(83,104,255,.08)_1px,transparent_1px)] bg-[size:25%_100%,100%_25%]" />
        <div className="absolute left-4 top-5 flex h-[190px] flex-col justify-between text-xs font-bold text-slate-600">
          {yAxis.map((value, index) => (
            <span key={`${value}-${index}`}>{value}</span>
          ))}
        </div>
        <svg
          viewBox="0 0 640 245"
          className="absolute inset-x-10 bottom-8 h-[205px] w-[calc(100%-5rem)] overflow-visible"
          role="img"
          aria-label="Student activity line chart"
        >
          <defs>
            <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#5368ff" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#7a4dff" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#lineFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#5368ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          {coordinates.map((point, index) => (
            <circle
              key={`${chartPoints[index].label}-${index}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#5368ff"
              stroke="#243856"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="absolute inset-x-10 bottom-3 grid text-xs font-bold text-slate-600" style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}>
          {chartPoints.map((point, index) => (
            <span key={`${point.label}-${index}`}>{point.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurriculumStatusCard({
  overallProgress,
  subjects,
}: {
  overallProgress?: number;
  subjects?: CurriculumStatusItem[];
}) {
  const visibleSubjects = subjects ?? [];
  const progress = Math.max(0, Math.min(100, overallProgress ?? 0));
  const conicStops = buildConicGradient(visibleSubjects);

  return (
    <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">Curriculum Status</h2>
        <span className="rounded-full bg-[#101a2b] px-3 py-1 text-xs font-bold text-slate-500">
          By Subject
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div
          className="grid h-48 w-48 place-items-center rounded-full"
          style={{
            background: conicStops,
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full border border-[#243856] bg-[#0b1324] text-center">
            <span className="text-2xl font-extrabold text-white">{progress}%</span>
          </div>
        </div>
        <div className="mt-6 w-full space-y-3">
          {visibleSubjects.length ? (
            visibleSubjects.map((item) => (
              <div key={item.subject_id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-400">
                  <i className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-extrabold text-white">{item.value}%</span>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-[#243856] bg-[#101a2b] px-4 py-3 text-center text-sm font-semibold text-slate-500">
              No curriculum data yet
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function buildConicGradient(subjects: CurriculumStatusItem[]) {
  const total = subjects.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  if (total === 0) {
    return "conic-gradient(#243856 0 100%)";
  }

  let cursor = 0;
  const stops = subjects.map((item) => {
    const start = cursor;
    const width = (Math.max(0, item.value) / total) * 100;
    cursor += width;
    return `${item.color} ${start.toFixed(1)}% ${cursor.toFixed(1)}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function SessionTable({
  sessions,
  count,
  page,
  totalPages,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  onOpen,
}: {
  sessions: Session[];
  count: number;
  page: number;
  totalPages: number;
  statusFilter: "All" | "Amber" | "Red";
  onStatusFilterChange: (status: "All" | "Amber" | "Red") => void;
  onPageChange: (page: number) => void;
  onOpen: (session: Session) => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col gap-4 border-b border-[#243856] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white">Flagged AI Sessions</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Review sessions that need admin or teacher attention.
          </p>
        </div>
        <div className="flex rounded-xl border border-[#243856] bg-[#101a2b] p-1">
          {(["All", "Amber", "Red"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                statusFilter === status
                  ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#101a2b] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-extrabold">Session ID</th>
              <th className="px-6 py-4 font-extrabold">Student</th>
              <th className="px-6 py-4 font-extrabold">Subject</th>
              <th className="px-6 py-4 font-extrabold">Grade</th>
              <th className="px-6 py-4 font-extrabold">Reason</th>
              <th className="px-6 py-4 font-extrabold">Status</th>
              <th className="px-6 py-4 text-right font-extrabold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243856]">
            {sessions.length ? (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="text-sm transition hover:bg-[#101a2b]/55"
                >
                  <td className="px-6 py-5 font-bold text-[#1fc7e9]">{session.id}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-white">{session.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{session.time}</p>
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-300">
                    {session.subject}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-300">
                    {session.grade}
                  </td>
                  <td className="max-w-xs px-6 py-5 leading-6 text-slate-500">
                    {session.reason}
                  </td>
                  <td className="px-6 py-5">
                    <SessionStatusPill status={session.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => onOpen(session)}
                      className="inline-flex h-9 items-center rounded-lg border border-[#243856] bg-[#101a2b] px-4 text-sm font-bold text-slate-300 transition hover:border-[#5368ff] hover:text-white"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm font-semibold text-slate-500"
                >
                  No flagged AI sessions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#243856] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-600">
          Showing {count ? (page - 1) * 3 + 1 : 0}-{Math.min(page * 3, count)} of{" "}
          {count} flagged sessions
        </p>
        <div className="flex gap-2">
          <PageButton disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </PageButton>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
            <PageButton
              key={item}
              active={item === page}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ))}
          <PageButton
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </PageButton>
        </div>
      </div>
    </section>
  );
}

function NotificationsPanel({
  notifications,
  onClose,
}: {
  notifications: DashboardNotification[];
  onClose: () => void;
}) {
  return (
    <div className="absolute right-20 top-14 z-30 w-[344px] overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] text-left shadow-[0_18px_45px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between border-b border-[#243856] px-5 py-4">
        <div>
          <p className="text-sm font-extrabold text-white">Notifications</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Platform activity and review alerts
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#243856] text-sm font-bold text-slate-500 transition hover:border-[#5368ff] hover:text-white"
          aria-label="Close notifications"
        >
          x
        </button>
      </div>
      <div className="divide-y divide-[#243856]">
        {notifications.length ? (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full gap-3 px-5 py-4 text-left transition hover:bg-[#101a2b]"
            >
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.tone === "amber"
                    ? "bg-amber-300"
                    : item.tone === "rose"
                      ? "bg-rose-300"
                      : "bg-[#5368ff]"
                }`}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-100">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                  {item.body}
                </span>
                <span className="mt-1 block text-[11px] font-bold text-[#7da6e6]">
                  {item.time}
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="px-5 py-6 text-center text-sm font-semibold text-slate-500">
            No notifications yet
          </p>
        )}
      </div>
    </div>
  );
}

function SessionDrawer({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <button
        className="absolute inset-0 cursor-default"
        aria-label="Close session details"
        onClick={onClose}
      />
      <aside className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[#35507a] bg-[#0b1324] shadow-[0_30px_90px_rgba(0,0,0,0.48)]">
        <div className="flex h-20 items-center justify-between border-b border-[#243856] bg-[#101a2b] px-7">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              {session.id}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              AI session review
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#243856] text-2xl leading-none text-slate-500 transition hover:border-[#5368ff] hover:bg-[#0b1324] hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="space-y-5 p-6">
          <DetailRow label="Student" value={session.name} />
          <DetailRow label="Subject" value={`${session.subject} / ${session.grade}`} />
          <DetailRow label="Reason" value={session.reason} />
          <DetailRow label="Status" value={session.status} />
          <div className="rounded-lg border border-[#35507a] bg-[#101a2b] p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Next Step</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Assign this session to a curriculum reviewer or mark it as resolved
              after confirming the AI response.
            </p>
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-[#35507a] bg-[#101a2b] text-sm font-bold text-white transition hover:border-[#5368ff] hover:bg-[#0b1324]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
          >
            Mark Reviewed
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function SessionStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        status === "Red"
          ? "bg-red-500/15 text-red-300"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {status}
    </span>
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-3 text-sm font-bold transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white"
          : "border-[#243856] bg-[#0b1324] text-slate-500 hover:border-[#5368ff] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#243856] disabled:hover:text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function NotificationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15.5 17.5h-7a2 2 0 0 1-1.7-3.05l.5-.8A4.6 4.6 0 0 0 8 11.2V9.5a4 4 0 0 1 8 0v1.7c0 .87.24 1.72.7 2.45l.5.8a2 2 0 0 1-1.7 3.05Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 19a2.2 2.2 0 0 0 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SidebarIcon({ name }: { name: string }) {
  const iconClass = "h-5 w-5";

  return (
    <span className="flex w-7 justify-center">
      {name === "dashboard" && (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
      {name === "curriculum" && (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5.5h7a3 3 0 0 1 3 3v10a3 3 0 0 0-3-3H5v-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M19 5.5h-4a3 3 0 0 0-3 3v10a3 3 0 0 1 3-3h4v-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
      {name === "students" && (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4 19a5 5 0 0 1 10 0M14 18a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      {name === "settings" && (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19 12a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-2-1.1L14.2 3h-4.4l-.4 2.8a7.8 7.8 0 0 0-2 1.1l-2.4-1-2 3.4 2 1.5A7.4 7.4 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 2 1.1l.4 2.8h4.4l.4-2.8a7.8 7.8 0 0 0 2-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
