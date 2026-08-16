"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

type AdminSection =
  | "Dashboard"
  | "Curriculum"
  | "Students"
  | "Settings";

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/admin_dashboard" },
  { label: "Curriculum", icon: "curriculum", href: "/grade_levels" },
  { label: "Students", icon: "students", href: "/students" },
  { label: "Settings", icon: "settings", href: "/settings" },
] as const;

export function AdminShell({
  active,
  title,
  subtitle,
  eyebrow = "Admin",
  action,
  profileImage,
  adminName = "Charya Som",
  adminRole = "Senior Admin",
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

  return (
    <main className="min-h-screen bg-[#070b19] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-[#243856] bg-[#070b19] px-6 py-7 lg:flex lg:flex-col">
          <Brand />

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-11 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold transition ${
                  active === item.label
                    ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
                }`}
              >
                <SidebarIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Charya Som admin profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "A"
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{adminName}</p>
                <Link
                  href="/auth/Login"
                  className="text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                >
                  Sign out
                </Link>
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
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#5368ff]" />
              </button>
              {isNotificationsOpen && (
                <NotificationsPanel
                  onClose={() => setIsNotificationsOpen(false)}
                />
              )}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-white">{adminName}</p>
                <p className="text-xs text-slate-500">{adminRole}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#5368ff] bg-gradient-to-br from-[#4367ff] to-[#7a4dff] text-sm font-extrabold text-white">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${adminName} admin profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "CS"
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

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const notifications = [
    {
      title: "AI review queue",
      body: "3 sessions need admin attention",
      time: "8 min ago",
      tone: "amber",
    },
    {
      title: "Student risk alert",
      body: "Dara Sok dropped below 45% progress",
      time: "24 min ago",
      tone: "rose",
    },
    {
      title: "Curriculum update",
      body: "Grade 12 Physics content was updated",
      time: "1 hour ago",
      tone: "blue",
    },
  ];

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
        {notifications.map((item) => (
          <button
            key={item.title}
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
        ))}
      </div>
    </div>
  );
}
