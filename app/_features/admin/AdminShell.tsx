"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  adminLogout,
  clearAdminSession,
  type DashboardNotification,
  getAccessToken,
  getStoredAdminUser,
  loadAdminDashboard,
  type AdminUser,
  verifyAdminSession,
} from "../auth/adminAuth";
import { curriculumLinks } from "../curriculum/data";

type AdminSection =
  | "Dashboard"
  | "Curriculum"
  | "Students"
  | "Settings";

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

export function AdminShell({
  active,
  title,
  subtitle,
  eyebrow = "Admin",
  action,
  profileImage,
  adminName = "Admin",
  adminRole = "Admin",
  children,
}: {
  active: AdminSection;
  title: string;
  subtitle: string;
  eyebrow?: string;
  action?: ReactNode;
  profileImage?: string | null;
  adminName?: string;
  adminRole?: string;
  children: ReactNode;
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(active === "Curriculum");
  const [storedUser, setStoredUser] = useState<AdminUser | null>(null);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const router = useRouter();
  const shouldShowCurriculumLinks = isCurriculumOpen;
  const displayName = storedUser?.full_name || adminName;
  const displayProfileImage = profileImage ?? storedUser?.profile_image_url ?? null;
  const displayRole =
    storedUser?.role === "administrator" || storedUser?.role === "admin"
      ? "Admin"
      : adminRole;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    setStoredUser(getStoredAdminUser());
    Promise.all([verifyAdminSession(), loadAdminDashboard()])
      .then(([user, dashboard]) => {
        setStoredUser({
          ...user,
          ...dashboard.admin,
        });
        setNotifications(dashboard.insights.notifications ?? []);
      })
      .catch((error) => {
        if (isAuthExpiredError(error)) {
          clearAdminSession();
          router.replace("/auth/Login");
        }
      });
  }, [router]);

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
              className={`flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold transition ${
                active === "Dashboard"
                  ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
              }`}
            >
              <SidebarIcon name="dashboard" />
              Dashboard
            </Link>

            <div className={shouldShowCurriculumLinks ? "rounded-xl bg-[#0b1324]" : "h-11 overflow-hidden"}>
              <button
                type="button"
                onClick={() => setIsCurriculumOpen((isOpen) => !isOpen)}
                className="flex h-11 w-full items-center gap-4 rounded-xl bg-transparent px-4 text-left text-sm font-semibold text-slate-500 transition hover:bg-[#101a2b] hover:text-slate-200"
                aria-expanded={isCurriculumOpen}
              >
                <SidebarIcon name="curriculum" />
                Curriculum
                <span className={`ml-auto flex h-5 w-5 items-center justify-center text-[#7da6e6] transition-transform ${shouldShowCurriculumLinks ? "rotate-180" : "rotate-0"}`}>
                  <ChevronDownIcon />
                </span>
              </button>
              {shouldShowCurriculumLinks && (
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
              className={`flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold transition ${
                active === "Students"
                  ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
              }`}
            >
              <SidebarIcon name="students" />
              Students
            </Link>
            <Link
              href="/settings"
              className={`flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold transition ${
                active === "Settings"
                  ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
              }`}
            >
              <SidebarIcon name="settings" />
              Settings
            </Link>
          </nav>

          <div className="mt-auto">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold">
                {displayProfileImage ? (
                  <img
                    src={displayProfileImage}
                    alt={`${displayName} admin profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "A"
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{displayName}</p>
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
              <span className="hidden text-slate-500 sm:inline">{eyebrow}</span>
              <span className="hidden text-slate-600 sm:inline">/</span>
              <span className="text-slate-200">{title}</span>
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
                <p className="text-sm font-bold text-white">{displayName}</p>
                <p className="text-xs text-slate-500">{displayRole}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#5368ff] bg-gradient-to-br from-[#4367ff] to-[#7a4dff] text-sm font-extrabold text-white">
                {displayProfileImage ? (
                  <img
                    src={displayProfileImage}
                    alt={`${displayName} admin profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "A"
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 md:px-8 lg:py-12">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {subtitle}
                </p>
              </div>
              {action}
            </div>

            {children}
          </div>
        </section>
      </div>
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

function NotificationIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
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
