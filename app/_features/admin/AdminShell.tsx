"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import {
  adminLogout,
  clearAdminSession,
  getAccessToken,
  getStoredAdminUser,
  loadAdminDashboard,
  verifyAdminSession,
  type AdminDashboardData,
  type AdminUser,
  type DashboardNotification,
} from "../auth/adminAuth";
import { Icon, type IconName } from "./Icon";
import { usePreferences, useStoredString, type ThemePreference } from "../preferences/Preferences";
import type { MessageKey } from "../preferences/messages";

type NavItem = { href: string; label: MessageKey; icon: IconName; badge?: "flagged" };
type NavSection = { label: MessageKey; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    label: "nav.overview",
    items: [
      { href: "/admin_dashboard", label: "nav.dashboard", icon: "dashboard" },
      { href: "/ai_reviews", label: "nav.aiReviews", icon: "review", badge: "flagged" },
      { href: "/students", label: "nav.students", icon: "students" },
    ],
  },
  {
    label: "nav.curriculum",
    items: [
      { href: "/grade_levels", label: "nav.grades", icon: "grades" },
      { href: "/subjects", label: "nav.subjects", icon: "subjects" },
      { href: "/topics", label: "nav.topics", icon: "topics" },
      { href: "/content", label: "nav.content", icon: "content" },
      { href: "/curriculum_versions", label: "nav.versions", icon: "versions" },
    ],
  },
  {
    label: "nav.system",
    items: [{ href: "/settings", label: "nav.settings", icon: "settings" }],
  },
];

function isAuthExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Admin session") ||
    error.message.includes("Invalid or expired authentication token") ||
    error.message.includes("Admin access is required")
  );
}

// Every page mounts its own shell, so share one in-flight bootstrap request for
// a short window instead of re-fetching the profile and alerts on each click.
let bootstrapCache: { at: number; promise: Promise<[AdminUser, AdminDashboardData]> } | null = null;
function loadShellBootstrap() {
  if (!bootstrapCache || Date.now() - bootstrapCache.at > 30_000) {
    const promise = Promise.all([verifyAdminSession(), loadAdminDashboard()]);
    bootstrapCache = { at: Date.now(), promise };
    promise.catch(() => {
      bootstrapCache = null;
    });
  }
  return bootstrapCache.promise;
}

export function AdminShell({
  title,
  subtitle,
  eyebrow,
  action,
  profileImage,
  adminName,
  adminRole,
  dashboard,
  hideHeading = false,
  children,
}: {
  /** Kept for existing call sites; the active item now follows the URL. */
  active?: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  profileImage?: string | null;
  adminName?: string;
  adminRole?: string;
  /** Pages that already load dashboard data pass it here to avoid a second request. */
  dashboard?: AdminDashboardData | null;
  hideHeading?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = usePreferences();
  const [storedUser, setStoredUser] = useState<AdminUser | null>(null);
  const [fetchedDashboard, setFetchedDashboard] = useState<AdminDashboardData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [collapsedValue, setCollapsedValue] = useStoredString("rean_admin_sidebar", "open");
  const isCollapsed = collapsedValue === "collapsed";
  const ownsData = dashboard === undefined;

  // Read the stored admin on the client only. getStoredAdminUser() returns null
  // during SSR, so seeding useState with it made the server HTML ("Admin") disagree
  // with the first client render (the real name), and React threw a hydration
  // mismatch on every admin page. The bootstrap effect below cannot cover this: it
  // returns early when the page supplies its own dashboard data.
  useEffect(() => {
    setStoredUser((current) => current ?? getStoredAdminUser());
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }
    if (!ownsData) return;
    let cancelled = false;
    loadShellBootstrap()
      .then(([user, data]) => {
        if (cancelled) return;
        setStoredUser({ ...user, ...data.admin });
        setFetchedDashboard(data);
      })
      .catch((error) => {
        if (!cancelled && isAuthExpiredError(error)) {
          clearAdminSession();
          router.replace("/auth/Login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router, ownsData]);

  // Close the phone drawer whenever the route changes.
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const data = ownsData ? fetchedDashboard : dashboard;
  const admin = { ...storedUser, ...data?.admin };
  const displayName = adminName || admin.full_name || "Admin";
  const displayImage = profileImage ?? admin.profile_image_url ?? null;
  const displayRole = adminRole || t("shell.admin");
  const notifications = data?.insights.notifications ?? [];
  const flaggedCount = data?.insights.flagged_ai_sessions.length ?? 0;

  const handleSignOut = useCallback(async () => {
    bootstrapCache = null;
    await adminLogout();
    router.replace("/auth/Login");
  }, [router]);

  const activeItem = navSections
    .flatMap((section) => section.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const activeSection = navSections.find((section) => activeItem && section.items.includes(activeItem));
  const crumb = eyebrow ?? (activeSection ? t(activeSection.label) : t("shell.admin"));

  return (
    <div className="min-h-screen bg-canvas text-fg lg:flex">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-line bg-surface transition-[width] duration-200 lg:flex lg:flex-col ${
          isCollapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        <SidebarContent
          collapsed={isCollapsed}
          flaggedCount={flaggedCount}
          pathname={pathname}
          onToggleCollapse={() => setCollapsedValue(isCollapsed ? "open" : "collapsed")}
        />
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("shell.openMenu")}>
          <button
            type="button"
            aria-label={t("shell.closeMenu")}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-[min(300px,86vw)] flex-col border-r border-line bg-surface shadow-2xl">
            <SidebarContent
              collapsed={false}
              flaggedCount={flaggedCount}
              pathname={pathname}
              onClose={() => setIsDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="-ml-1 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-surface-2 hover:text-fg lg:hidden"
            aria-label={t("shell.openMenu")}
          >
            <Icon name="menu" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-500 sm:inline">{crumb}</span>
            <Icon name="chevronRight" className="hidden h-3.5 w-3.5 text-slate-600 sm:block" />
            <span className="truncate font-semibold text-fg">{title}</span>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-slate-500 transition hover:border-line-strong hover:text-fg md:flex"
            >
              <Icon name="search" className="h-4 w-4" />
              <span className="w-28 text-left">{t("shell.jumpTo")}</span>
              <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans text-[11px] text-slate-500">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-surface-2 hover:text-fg md:hidden"
              aria-label={t("shell.jumpTo")}
            >
              <Icon name="search" className="h-[18px] w-[18px]" />
            </button>
            <LanguageToggle />
            <NotificationsButton notifications={notifications} />
            <ProfileMenu
              name={displayName}
              email={admin.email}
              role={displayRole}
              image={displayImage}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!hideHeading && (
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{title}</h1>
                {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
              </div>
              {action}
            </div>
          )}
          {children}
        </main>
      </div>

      {isPaletteOpen && (
        <CommandPalette onClose={() => setIsPaletteOpen(false)} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  const { t } = usePreferences();
  return (
    <Link href="/admin_dashboard" className="flex min-w-0 items-center gap-3">
      <Image
        src="/AI Tutor_Logo.png"
        alt="Rean AI"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 object-contain"
        priority
      />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-[17px] font-bold leading-tight tracking-tight text-fg">
            Rean <span className="font-khmer text-brand">រៀន</span> AI
          </span>
          <span className="block truncate text-[11px] font-medium text-slate-500">{t("shell.tagline")}</span>
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  flaggedCount,
  pathname,
  onToggleCollapse,
  onClose,
}: {
  collapsed: boolean;
  flaggedCount: number;
  pathname: string;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}) {
  const { t } = usePreferences();
  return (
    <>
      <div className={`flex h-16 shrink-0 items-center border-b border-line ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Brand collapsed={collapsed} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-surface-2 hover:text-fg"
            aria-label={t("shell.closeMenu")}
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t(section.label)}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badge = item.badge === "flagged" && flaggedCount > 0 ? flaggedCount : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? t(item.label) : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition ${
                        collapsed ? "justify-center" : "px-3"
                      } ${
                        isActive
                          ? "bg-brand/12 text-fg"
                          : "text-slate-400 hover:bg-surface-2 hover:text-fg"
                      }`}
                    >
                      {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full brand-gradient" />}
                      <span className={isActive ? "text-brand" : ""}>
                        <Icon name={item.icon} className="h-[18px] w-[18px]" />
                      </span>
                      {!collapsed && <span className="truncate">{t(item.label)}</span>}
                      {badge > 0 &&
                        (collapsed ? (
                          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-rose-500" />
                        ) : (
                          <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                            {badge}
                          </span>
                        ))}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggleCollapse && (
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex h-9 w-full items-center gap-3 rounded-lg text-sm text-slate-500 transition hover:bg-surface-2 hover:text-fg ${collapsed ? "justify-center" : "px-3"}`}
            aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
            title={collapsed ? t("shell.expand") : undefined}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} className="h-4 w-4" />
            {!collapsed && t("shell.collapse")}
          </button>
        </div>
      )}
      {onClose && (
        <div className="space-y-3 border-t border-line p-4">
          <ThemeSegmented />
        </div>
      )}
    </>
  );
}

function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}

function LanguageToggle() {
  const { lang, setLang, t } = usePreferences();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "km" : "en")}
      className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-400 transition hover:bg-surface-2 hover:text-fg"
      aria-label={t("shell.switchLanguage")}
      title={t("shell.switchLanguage")}
    >
      <Icon name="globe" className="h-[18px] w-[18px]" />
      <span className={lang === "en" ? "font-khmer" : ""}>{lang === "en" ? "ខ្មែរ" : "EN"}</span>
    </button>
  );
}

function NotificationsButton({ notifications }: { notifications: DashboardNotification[] }) {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-surface-2 hover:text-fg"
        aria-label={t("shell.notifications")}
        aria-expanded={open}
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {notifications.length > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-card sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[360px]">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-fg">{t("shell.notifications")}</p>
            <p className="text-xs text-slate-500">{t("shell.notificationsSub")}</p>
          </div>
          <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {notifications.length ? (
              notifications.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.tone === "amber" ? "bg-amber-500" : item.tone === "rose" ? "bg-rose-500" : "bg-brand"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.body}</span>
                    <span className="mt-1 block text-[11px] font-medium text-accent-fg">{item.time}</span>
                  </span>
                </li>
              ))
            ) : (
              <li className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-500">
                <Icon name="check" className="h-5 w-5 text-emerald-300" />
                {t("shell.noNotifications")}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThemeSegmented() {
  const { theme, setTheme, t } = usePreferences();
  const options: { value: ThemePreference; icon: IconName; label: MessageKey }[] = [
    { value: "light", icon: "sun", label: "shell.themeLight" },
    { value: "dark", icon: "moon", label: "shell.themeDark" },
    { value: "system", icon: "monitor", label: "shell.themeSystem" },
  ];
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t("shell.theme")}</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface-2 p-1" role="radiogroup" aria-label={t("shell.theme")}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => setTheme(option.value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition ${
              theme === option.value ? "bg-surface text-fg shadow-sm" : "text-slate-500 hover:text-fg"
            }`}
          >
            <Icon name={option.icon} className="h-3.5 w-3.5" />
            {t(option.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Avatar({ name, image, size = "h-9 w-9" }: { name: string; image: string | null; size?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full brand-gradient text-xs font-bold text-white ${size}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin photos are arbitrary uploaded URLs
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

function ProfileMenu({
  name,
  email,
  role,
  image,
  onSignOut,
}: {
  name: string;
  email?: string;
  role: string;
  image: string | null;
  onSignOut: () => void;
}) {
  const { lang, setLang, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full p-0.5 transition hover:bg-surface-2 sm:rounded-lg sm:py-1 sm:pl-1 sm:pr-2"
        aria-label={t("shell.account")}
        aria-expanded={open}
      >
        <Avatar name={name} image={image} />
        <span className="hidden text-left xl:block">
          <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight text-fg">{name}</span>
          <span className="block text-xs leading-tight text-slate-500">{role}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={name} image={image} size="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{name}</p>
              <p className="truncate text-xs text-slate-500">{email || role}</p>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <ThemeSegmented />
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t("shell.language")}</p>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1" role="radiogroup" aria-label={t("shell.language")}>
                {(["en", "km"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={lang === code}
                    onClick={() => setLang(code)}
                    className={`h-8 rounded-md text-xs font-medium transition ${
                      lang === code ? "bg-surface text-fg shadow-sm" : "text-slate-500 hover:text-fg"
                    } ${code === "km" ? "font-khmer" : ""}`}
                  >
                    {code === "en" ? "English" : "ខ្មែរ"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-line p-2">
            <Link
              href="/settings"
              className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="settings" className="h-4 w-4" />
              {t("nav.settings")}
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              <Icon name="logout" className="h-4 w-4" />
              {t("shell.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type PaletteEntry = { id: string; group: "pages" | "actions"; label: string; hint?: string; icon: IconName; run: () => void };

function CommandPalette({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const router = useRouter();
  const { t, lang, setLang, setTheme } = usePreferences();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<PaletteEntry[]>(() => {
    const pages: PaletteEntry[] = navSections.flatMap((section) =>
      section.items.map((item) => ({
        id: item.href,
        group: "pages" as const,
        label: t(item.label),
        hint: t(section.label),
        icon: item.icon,
        run: () => router.push(item.href),
      })),
    );
    const actions: PaletteEntry[] = [
      {
        id: "lang",
        group: "actions",
        label: lang === "en" ? "ប្ដូរទៅភាសាខ្មែរ · Switch to Khmer" : "Switch to English · ប្ដូរទៅភាសាអង់គ្លេស",
        icon: "globe",
        run: () => setLang(lang === "en" ? "km" : "en"),
      },
      { id: "light", group: "actions", label: `${t("shell.theme")}: ${t("shell.themeLight")}`, icon: "sun", run: () => setTheme("light") },
      { id: "dark", group: "actions", label: `${t("shell.theme")}: ${t("shell.themeDark")}`, icon: "moon", run: () => setTheme("dark") },
      { id: "system", group: "actions", label: `${t("shell.theme")}: ${t("shell.themeSystem")}`, icon: "monitor", run: () => setTheme("system") },
      { id: "signout", group: "actions", label: t("shell.signOut"), icon: "logout", run: onSignOut },
    ];
    return [...pages, ...actions];
  }, [t, lang, setLang, setTheme, router, onSignOut]);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? entries.filter((entry) => `${entry.label} ${entry.hint ?? ""} ${entry.id}`.toLowerCase().includes(needle))
    : entries;
  const safeCursor = Math.min(cursor, Math.max(0, results.length - 1));

  function runEntry(entry: PaletteEntry | undefined) {
    if (!entry) return;
    onClose();
    entry.run();
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Escape") onClose();
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((safeCursor + 1) % Math.max(1, results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((safeCursor - 1 + results.length) % Math.max(1, results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runEntry(results[safeCursor]);
    }
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${safeCursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeCursor]);

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t("shell.jumpTo")}>
      <button type="button" aria-label={t("shell.close")} className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-card" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            placeholder={t("shell.jumpPlaceholder")}
            className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-slate-500"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
          />
          <kbd className="rounded border border-line bg-surface-2 px-1.5 text-[11px] text-slate-500">Esc</kbd>
        </div>
        <ul id="command-results" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">{t("shell.noResults")}</li>}
          {results.map((entry, index) => {
            const header = entry.group !== lastGroup ? entry.group : null;
            lastGroup = entry.group;
            return (
              <li key={entry.id} role="presentation">
                {header && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {t(header === "pages" ? "shell.pages" : "shell.actions")}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === safeCursor}
                  data-index={index}
                  onMouseMove={() => setCursor(index)}
                  onClick={() => runEntry(entry)}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                    index === safeCursor ? "bg-brand/12 text-fg" : "text-slate-300"
                  }`}
                >
                  <Icon name={entry.icon} className="h-4 w-4 text-slate-500" />
                  <span className="flex-1 truncate">{entry.label}</span>
                  {entry.hint && <span className="text-xs text-slate-500">{entry.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
