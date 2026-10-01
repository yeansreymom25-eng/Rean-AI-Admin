import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../_features/preferences/Preferences";

const replace = vi.fn();
const push = vi.fn();
const router = { replace, push };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a>,
}));
vi.mock("../_features/admin/AdminShell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-shell">{children}</div>,
}));

const auth = vi.hoisted(() => ({
  clearAdminSession: vi.fn(),
  getAccessToken: vi.fn<() => string | null>(),
  loadAdminDashboard: vi.fn(),
}));
vi.mock("../_features/auth/adminAuth", () => auth);

import Dashboard from "./dashboard";

const emptyDashboard = {
  admin: { full_name: "Sokha Dara" },
  metrics: {
    total_students: { value: 0, display: "0", accent: "No learners" },
    active_ai_sessions: { value: 0, display: "0", accent: "No sessions" },
    curriculum_progress: { value: 0, display: "0%", accent: "No curriculum" },
    ai_quality_score: { value: 0, display: "—", accent: "No reviews" },
  },
  insights: {
    student_activity: { last_7_days: [], last_30_days: [] },
    curriculum_status: { overall_progress: 0, subjects: [] },
    flagged_ai_sessions: [],
    notifications: [],
  },
};

function renderDashboard() {
  return render(<PreferencesProvider><Dashboard /></PreferencesProvider>);
}

describe("admin dashboard states", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    replace.mockReset();
    auth.clearAdminSession.mockReset();
    auth.getAccessToken.mockReset();
    auth.loadAdminDashboard.mockReset();
    auth.getAccessToken.mockReturnValue("cookie-session");
  });

  it("redirects before loading when the admin session is missing", async () => {
    auth.getAccessToken.mockReturnValue(null);
    renderDashboard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/Login"));
    expect(auth.loadAdminDashboard).not.toHaveBeenCalled();
  });

  it("shows an updating state while the dashboard request is pending", async () => {
    auth.loadAdminDashboard.mockReturnValue(new Promise(() => undefined));
    renderDashboard();

    await waitFor(() => expect(auth.loadAdminDashboard).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Updating…")).toBeInTheDocument();
    expect(screen.getByLabelText("Refresh")).toBeDisabled();
  });

  it("renders a genuine empty state from a successful empty payload", async () => {
    auth.loadAdminDashboard.mockResolvedValue(emptyDashboard);
    renderDashboard();

    await waitFor(() => expect(screen.getByText("No student activity in this period yet.")).toBeInTheDocument());
    expect(screen.getByText("No curriculum data yet. Publish a subject to start tracking.")).toBeInTheDocument();
    expect(screen.getAllByText("All clear — no flagged tutor sessions.")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows request errors and lets the administrator retry", async () => {
    auth.loadAdminDashboard
      .mockRejectedValueOnce(new Error("Dashboard service unavailable"))
      .mockResolvedValueOnce(emptyDashboard);
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Dashboard service unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(auth.loadAdminDashboard).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("clears an expired session and redirects to login", async () => {
    auth.loadAdminDashboard.mockRejectedValue(new Error("Admin access is required"));
    renderDashboard();

    await waitFor(() => expect(auth.clearAdminSession).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/auth/Login");
  });
});
