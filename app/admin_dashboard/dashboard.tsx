"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AdminShell } from "../_features/admin/AdminShell";
import { Icon, type IconName } from "../_features/admin/Icon";
import {
  clearAdminSession,
  getAccessToken,
  loadAdminDashboard,
  type AdminDashboardData,
  type CurriculumStatusItem,
  type DashboardMetric,
  type FlaggedAiSession,
  type StudentActivityPoint,
} from "../_features/auth/adminAuth";
import { usePreferences, useStoredString } from "../_features/preferences/Preferences";
import type { MessageKey } from "../_features/preferences/messages";

const DASHBOARD_CACHE_KEY = "rean_admin_dashboard_cache_v2";
const CACHE_TTL_MS = 5 * 60_000;
const AUTO_REFRESH_MS = 60_000;
const PAGE_SIZE = 5;

type Range = "7" | "30";
type Priority = "All" | "Red" | "Amber";

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

function readCachedDashboard(): { data: AdminDashboardData; savedAt: number } | null {
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; data: AdminDashboardData };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function storeCachedDashboard(data: AdminDashboardData) {
  try {
    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage full or blocked; the live data is still on screen.
  }
}

// A coarse clock (15 s ticks) for "updated 2 minutes ago" and the greeting.
// The server snapshot is 0 so the first client render matches the HTML.
function subscribeClock(onTick: () => void) {
  const id = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(id);
}
const readClock = () => Math.floor(Date.now() / 15_000) * 15_000;

export default function Dashboard() {
  const router = useRouter();
  const { t, formatRelative } = usePreferences();
  const now = useSyncExternalStore(subscribeClock, readClock, () => 0);
  const [rangeValue, setRangeValue] = useStoredString("rean_admin_dashboard_range", "7");
  const range: Range = rangeValue === "30" ? "30" : "7";

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<FlaggedAiSession | null>(null);
  const inFlight = useRef(false);
  const lastLoad = useRef(0);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsRefreshing(true);
    try {
      const next = await loadAdminDashboard();
      setData(next);
      setUpdatedAt(Date.now());
      setError("");
      storeCachedDashboard(next);
    } catch (loadError) {
      if (isAuthExpiredError(loadError)) {
        clearAdminSession();
        router.replace("/auth/Login");
        return;
      }
      setError(loadError instanceof Error && loadError.message ? loadError.message : "Request failed");
    } finally {
      lastLoad.current = Date.now();
      inFlight.current = false;
      setIsRefreshing(false);
    }
  }, [router]);

  // First paint from the session cache, then fetch live data.
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }
    queueMicrotask(() => {
      const cached = readCachedDashboard();
      if (cached) {
        setData((current) => current ?? cached.data);
        setUpdatedAt((current) => current ?? cached.savedAt);
      }
      void refresh();
    });
  }, [refresh, router]);

  // Keep the numbers live: poll while the tab is visible, and catch up as soon
  // as the admin comes back to a tab that has been in the background.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, AUTO_REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad.current > 20_000) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  const adminName = data?.admin.full_name?.split(" ")[0];
  const hour = now ? new Date(now).getHours() : null;
  const greeting =
    hour === null ? null : hour < 12 ? t("dash.goodMorning") : hour < 18 ? t("dash.goodAfternoon") : t("dash.goodEvening");
  const flagged = data?.insights.flagged_ai_sessions ?? [];

  return (
    <AdminShell title={t("nav.dashboard")} dashboard={data} hideHeading>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">
            {greeting ? `${greeting}${adminName ? `, ${adminName}` : ""}` : t("nav.dashboard")}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{t("dash.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LiveStatus
            isRefreshing={isRefreshing}
            hasError={Boolean(error)}
            label={
              isRefreshing
                ? t("dash.updating")
                : updatedAt && now
                  ? t("dash.updated", { time: formatRelative(new Date(updatedAt), Math.max(now, updatedAt)) })
                  : t("dash.updating")
            }
          />
          <Segmented
            label="Range"
            value={range}
            options={[
              { value: "7", label: t("dash.last7") },
              { value: "30", label: t("dash.last30") },
            ]}
            onChange={(value) => setRangeValue(value)}
          />
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-slate-400 transition hover:border-line-strong hover:text-fg disabled:opacity-60"
            aria-label={t("dash.refresh")}
            title={t("dash.refresh")}
          >
            <Icon name="refresh" className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 sm:flex-row sm:items-center">
          <Icon name="alert" className="h-5 w-5 shrink-0 text-rose-300" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-rose-200">{t("dash.loadError")}</p>
            <p className="truncate text-rose-300/80">{data ? `${t("dash.offline")} · ${error}` : error}</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="h-9 rounded-lg border border-rose-400/40 px-3 text-sm font-medium text-rose-200 hover:bg-rose-500/10"
          >
            {t("dash.retry")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard href="/students" icon="students" tone="brand" label={t("dash.totalStudents")} metric={data?.metrics.total_students} />
        <KpiCard href="/ai_reviews" icon="sparkles" tone="info" label={t("dash.activeSessions")} metric={data?.metrics.active_ai_sessions} />
        <KpiCard href="/curriculum_versions" icon="grades" tone="violet" label={t("dash.curriculumProgress")} metric={data?.metrics.curriculum_progress} />
        <KpiCard href="/ai_reviews" icon="review" tone="emerald" label={t("dash.aiQuality")} metric={data?.metrics.ai_quality_score} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ActivityCard
          range={range}
          points={data ? (range === "7" ? data.insights.student_activity.last_7_days : data.insights.student_activity.last_30_days) : undefined}
        />
        <CoverageCard
          overall={data?.insights.curriculum_status.overall_progress}
          subjects={data?.insights.curriculum_status.subjects}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FlaggedSessions sessions={data ? flagged : undefined} onOpen={setSelected} />
        <div className="flex flex-col gap-4">
          <AttentionCard sessions={data ? flagged : undefined} />
          <QuickActions />
        </div>
      </div>

      {selected && <SessionDialog session={selected} onClose={() => setSelected(null)} />}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------------ */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface shadow-card ${className}`}>{children}</section>;
}

function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex h-full items-center gap-1.5 rounded-md px-3 text-sm font-medium transition ${
            value === option.value ? "bg-surface-3 text-fg" : "text-slate-500 hover:text-fg"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="rounded-full bg-surface-2 px-1.5 text-[11px] tabular-nums text-slate-400">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function LiveStatus({ label, isRefreshing, hasError }: { label: string; isRefreshing: boolean; hasError: boolean }) {
  const { t } = usePreferences();
  return (
    <span className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs text-slate-500" aria-live="polite">
      <span className="relative flex h-2 w-2">
        {!hasError && !isRefreshing && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />}
        <span className={`relative h-2 w-2 rounded-full ${hasError ? "bg-rose-500" : isRefreshing ? "bg-amber-500" : "bg-emerald-500"}`} />
      </span>
      <span className="font-medium text-slate-300">{hasError ? t("dash.offline") : t("dash.live")}</span>
      <span className="hidden sm:inline">· {label}</span>
    </span>
  );
}

const toneStyles = {
  brand: "bg-brand/12 text-brand",
  info: "bg-info/12 text-info",
  violet: "bg-violet-500/12 text-violet-300",
  emerald: "bg-emerald-500/12 text-emerald-300",
} as const;

function accentTone(accent: string) {
  const text = accent.trim().toLowerCase();
  if (text.startsWith("-") || text.startsWith("−") || text.includes("down") || text.includes("needs")) return "text-rose-300 bg-rose-500/10";
  if (text.startsWith("+") || text.includes("live") || text.includes("excellent") || text.includes("good")) return "text-emerald-300 bg-emerald-500/10";
  return "text-slate-400 bg-surface-2";
}

function KpiCard({
  href,
  icon,
  tone,
  label,
  metric,
}: {
  href: string;
  icon: IconName;
  tone: keyof typeof toneStyles;
  label: string;
  metric?: DashboardMetric;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneStyles[tone]}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <Icon name="arrowRight" className="h-4 w-4 text-slate-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
      <p className="mt-4 truncate text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
      {metric ? (
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-fg sm:text-[28px]">{metric.display}</p>
      ) : (
        <span className="skeleton mt-2 block h-7 w-20 rounded-md" />
      )}
      {metric ? (
        metric.accent && (
          <span className={`mt-2 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${accentTone(metric.accent)}`}>
            {metric.accent}
          </span>
        )
      ) : (
        <span className="skeleton mt-2 block h-4 w-24 rounded-full" />
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------------ */

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceCeiling(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value / 4) ?? 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

function ActivityCard({ range, points }: { range: Range; points?: StudentActivityPoint[] }) {
  const { t, formatNumber } = usePreferences();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 220;
  const pad = { top: 12, right: 12, bottom: 26, left: 36 };

  const series = points ?? [];
  const total = series.reduce((sum, point) => sum + point.value, 0);
  const peak = series.reduce((max, point) => Math.max(max, point.value), 0);
  const average = series.length ? total / series.length : 0;
  const yMax = niceCeiling(peak);
  const innerWidth = Math.max(0, width - pad.left - pad.right);
  const innerHeight = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (series.length <= 1 ? innerWidth / 2 : (index / (series.length - 1)) * innerWidth);
  const y = (value: number) => pad.top + innerHeight - (value / yMax) * innerHeight;
  const line = series.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(" ");
  const area = series.length ? `${line} L${x(series.length - 1).toFixed(1)} ${pad.top + innerHeight} L${x(0).toFixed(1)} ${pad.top + innerHeight} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(yMax * fraction));
  const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(1, Math.floor(innerWidth / 56))));
  const hovered = hover !== null ? series[hover] : undefined;

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!series.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - bounds.left - pad.left;
    const index = series.length <= 1 ? 0 : Math.round((relative / innerWidth) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, index)));
  }

  return (
    <Card>
      <CardHeader
        title={t("dash.activity")}
        subtitle={range === "7" ? t("dash.activitySub7") : t("dash.activitySub30")}
      />
      <dl className="grid grid-cols-3 gap-3 px-5 pt-4">
        {([
          ["dash.total", total],
          ["dash.peak", peak],
          ["dash.average", Math.round(average * 10) / 10],
        ] as [MessageKey, number][]).map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs text-slate-500">{t(key)}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{points ? formatNumber(value) : <span className="skeleton block h-6 w-12 rounded" />}</dd>
          </div>
        ))}
      </dl>
      <div ref={ref} className="relative px-2 pb-3 pt-2">
        {!points ? (
          <div className="skeleton mx-3 h-[208px] rounded-lg" />
        ) : total === 0 ? (
          <div className="grid h-[220px] place-items-center text-sm text-slate-500">{t("dash.noActivity")}</div>
        ) : width > 0 ? (
          <>
            <svg
              width={width}
              height={height}
              className="block touch-none"
              role="img"
              aria-label={`${t("dash.activity")}: ${series.map((point) => `${point.label} ${point.value}`).join(", ")}`}
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--c-brand)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--c-brand)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((tick) => (
                <g key={tick}>
                  <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--c-line)" strokeDasharray={tick ? "3 4" : undefined} />
                  <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
                    {formatNumber(tick)}
                  </text>
                </g>
              ))}
              <path d={area} fill="url(#activityFill)" />
              <path d={line} fill="none" stroke="var(--c-brand)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {series.map((point, index) =>
                index % labelEvery === 0 || index === series.length - 1 ? (
                  <text key={`${point.label}-${index}`} x={x(index)} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[11px]">
                    {point.label}
                  </text>
                ) : null,
              )}
              {hover !== null && hovered && (
                <g>
                  <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerHeight} stroke="var(--c-line-strong)" />
                  <circle cx={x(hover)} cy={y(hovered.value)} r={5} fill="var(--c-surface)" stroke="var(--c-brand)" strokeWidth={2.5} />
                </g>
              )}
            </svg>
            {hover !== null && hovered && (
              <div
                className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card"
                style={{
                  left: Math.min(Math.max(x(hover) + 8 - 60, 8), width - 128),
                }}
              >
                <p className="text-slate-500">{hovered.label}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{formatNumber(hovered.value)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="h-[220px]" />
        )}
      </div>
    </Card>
  );
}

function CoverageCard({ overall, subjects }: { overall?: number; subjects?: CurriculumStatusItem[] }) {
  const { t, formatNumber } = usePreferences();
  const items = subjects ?? [];
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const progress = Math.max(0, Math.min(100, overall ?? 0));

  return (
    <Card className="flex flex-col">
      <CardHeader title={t("dash.curriculumStatus")} subtitle={t("dash.curriculumSub")} />
      {!subjects ? (
        <div className="flex flex-1 flex-col items-center gap-4 p-5">
          <span className="skeleton h-36 w-36 rounded-full" />
          <span className="skeleton h-4 w-full rounded" />
          <span className="skeleton h-4 w-full rounded" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5 p-5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
          <div className="relative mx-auto h-36 w-36 shrink-0">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--c-surface-3)" strokeWidth="14" />
              {total > 0 &&
                items.map((item) => {
                  const length = (Math.max(0, item.value) / total) * circumference;
                  const gap = items.length > 1 ? 2 : 0;
                  const segment = (
                    <circle
                      key={item.subject_id}
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="14"
                      strokeDasharray={`${Math.max(0, length - gap)} ${circumference}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += length;
                  return segment;
                })}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-bold tabular-nums text-fg">{progress}%</p>
                <p className="text-[11px] text-slate-500">{t("dash.overall")}</p>
              </div>
            </div>
          </div>

          {items.length ? (
            <ul className="w-full space-y-3">
              {items.map((item) => (
                <li key={item.subject_id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-medium text-slate-300">{item.label}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-fg">{item.value}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, item.average_progress)}%`, backgroundColor: item.color }} />
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-500">{t("dash.learners", { n: formatNumber(item.selected_students) })}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-slate-500">{t("dash.noCurriculum")}</p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------------ */

function PriorityPill({ status }: { status: FlaggedAiSession["status"] }) {
  const { t } = usePreferences();
  const high = status === "Red";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        high ? "bg-rose-500/12 text-rose-300" : "bg-amber-500/12 text-amber-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${high ? "bg-rose-500" : "bg-amber-500"}`} />
      {high ? t("dash.high") : t("dash.medium")}
    </span>
  );
}

function FlaggedSessions({ sessions, onOpen }: { sessions?: FlaggedAiSession[]; onOpen: (session: FlaggedAiSession) => void }) {
  const { t } = usePreferences();
  const [priority, setPriority] = useState<Priority>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const all = useMemo(() => sessions ?? [], [sessions]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(
      (session) =>
        (priority === "All" || session.status === priority) &&
        (!needle || [session.id, session.name, session.subject, session.grade, session.reason].join(" ").toLowerCase().includes(needle)),
    );
  }, [all, priority, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const count = (status: FlaggedAiSession["status"]) => all.filter((session) => session.status === status).length;

  return (
    <Card className="flex flex-col">
      <CardHeader title={t("dash.flagged")} subtitle={t("dash.flaggedSub")} />
      <div className="flex flex-col gap-2 px-5 pt-4 sm:flex-row sm:items-center">
        <Segmented<Priority>
          label={t("dash.priority")}
          value={priority}
          options={[
            { value: "All", label: t("dash.all"), count: all.length },
            { value: "Red", label: t("dash.high"), count: count("Red") },
            { value: "Amber", label: t("dash.medium"), count: count("Amber") },
          ]}
          onChange={(value) => {
            setPriority(value);
            setPage(1);
          }}
        />
        <label className="relative flex-1">
          <span className="sr-only">{t("dash.search")}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t("dash.search")}
            className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      <ul className="mt-3 flex-1 divide-y divide-line border-t border-line">
        {!sessions ? (
          Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-4">
              <span className="skeleton h-9 w-9 rounded-full" />
              <span className="flex-1 space-y-2">
                <span className="skeleton block h-4 w-40 rounded" />
                <span className="skeleton block h-3 w-64 max-w-full rounded" />
              </span>
            </li>
          ))
        ) : visible.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-slate-500">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/12 text-emerald-300">
              <Icon name="check" className="h-5 w-5" />
            </span>
            {all.length === 0 ? t("dash.allClear") : t("dash.noFlagged")}
          </li>
        ) : (
          visible.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => onOpen(session)}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-surface-2"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-slate-300">
                  {session.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-fg">{session.name}</span>
                    <PriorityPill status={session.status} />
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {session.subject} · {session.grade} · <span className="font-mono">{session.id}</span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-slate-400">{session.reason}</span>
                </span>
                <span className="hidden shrink-0 text-xs text-slate-500 sm:block">{session.time}</span>
              </button>
            </li>
          ))
        )}
      </ul>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-slate-500">
          <span className="tabular-nums">
            {t("dash.showing", {
              from: (safePage - 1) * PAGE_SIZE + 1,
              to: Math.min(safePage * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-slate-400 hover:text-fg disabled:opacity-40"
              aria-label={t("dash.previous")}
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-slate-400 hover:text-fg disabled:opacity-40"
              aria-label={t("dash.next")}
            >
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function AttentionCard({ sessions }: { sessions?: FlaggedAiSession[] }) {
  const { t, formatNumber } = usePreferences();
  if (!sessions) return <Card className="skeleton h-[132px]"><span className="sr-only">{t("dash.updating")}</span></Card>;

  const high = sessions.filter((session) => session.status === "Red").length;
  const medium = sessions.length - high;
  const clear = sessions.length === 0;

  return (
    <Card
      className={`overflow-hidden p-5 ${
        clear ? "" : high ? "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent" : "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            clear ? "bg-emerald-500/12 text-emerald-300" : high ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
          }`}
        >
          <Icon name={clear ? "check" : "alert"} className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-[15px] font-semibold text-fg">{t("dash.attention")}</h2>
      </div>
      {clear ? (
        <p className="mt-3 text-sm text-slate-400">{t("dash.allClear")}</p>
      ) : (
        <>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-2xl font-bold tabular-nums text-rose-300">{formatNumber(high)}</p>
              <p className="text-xs text-slate-500">{t("dash.attentionHigh")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-amber-300">{formatNumber(medium)}</p>
              <p className="text-xs text-slate-500">{t("dash.attentionMedium")}</p>
            </div>
          </div>
          <Link
            href="/ai_reviews"
            className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg brand-gradient text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("dash.openQueue")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </>
      )}
    </Card>
  );
}

function QuickActions() {
  const { t } = usePreferences();
  const actions: { href: string; icon: IconName; title: MessageKey; sub: MessageKey }[] = [
    { href: "/content", icon: "content", title: "dash.qaContent", sub: "dash.qaContentSub" },
    { href: "/curriculum_versions", icon: "versions", title: "dash.qaPublish", sub: "dash.qaPublishSub" },
    { href: "/ai_reviews", icon: "review", title: "dash.qaReviews", sub: "dash.qaReviewsSub" },
    { href: "/students", icon: "students", title: "dash.qaStudents", sub: "dash.qaStudentsSub" },
  ];
  return (
    <Card className="flex-1">
      <CardHeader title={t("dash.quickActions")} />
      <ul className="p-2 pt-3">
        {actions.map((action) => (
          <li key={action.href + action.title}>
            <Link href={action.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-surface-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-slate-400 group-hover:text-brand">
                <Icon name={action.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{t(action.title)}</span>
                <span className="block truncate text-xs text-slate-500">{t(action.sub)}</span>
              </span>
              <Icon name="chevronRight" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SessionDialog({ session, onClose }: { session: FlaggedAiSession; onClose: () => void }) {
  const { t } = usePreferences();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: [MessageKey, ReactNode][] = [
    ["dash.student", session.name],
    ["dash.subject", session.subject],
    ["dash.grade", session.grade],
    ["dash.priority", <PriorityPill key="p" status={session.status} />],
    ["dash.reason", session.reason],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t("dash.sessionReview")}>
      <button type="button" aria-label={t("shell.close")} className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-card sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{t("dash.sessionReview")} · {session.time}</p>
            <h2 className="mt-0.5 truncate font-mono text-base font-semibold text-fg">{session.id}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-surface-2 hover:text-fg" aria-label={t("shell.close")}>
            <Icon name="close" className="h-[18px] w-[18px]" />
          </button>
        </div>
        <dl className="space-y-4 overflow-y-auto px-5 py-5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
              <dt className="text-slate-500">{t(label)}</dt>
              <dd className="whitespace-pre-wrap text-fg">{value}</dd>
            </div>
          ))}
          <p className="flex gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-5 text-slate-400">
            <Icon name="review" className="h-4 w-4 shrink-0 text-brand" />
            {t("dash.reviewHint")}
          </p>
        </dl>
        <div className="grid gap-2 border-t border-line p-4 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line text-sm font-medium text-fg hover:bg-surface-2">
            {t("shell.close")}
          </button>
          <Link
            href="/ai_reviews"
            className="flex h-10 items-center justify-center gap-2 rounded-lg brand-gradient text-sm font-semibold text-white hover:brightness-110"
          >
            {t("dash.openInQueue")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
