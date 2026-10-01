import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../preferences/Preferences";

const replace = vi.fn();
const push = vi.fn();
let pathname = "/admin_dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace, push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    return React.createElement("img", { ...props, alt: props.alt ?? "" });
  },
}));

const auth = vi.hoisted(() => ({
  adminLogout: vi.fn(),
  clearAdminSession: vi.fn(),
  getAccessToken: vi.fn<() => string | null>(),
  getStoredAdminUser: vi.fn(),
  loadAdminDashboard: vi.fn(),
  verifyAdminSession: vi.fn(),
}));

vi.mock("../auth/adminAuth", () => auth);

import { AdminShell } from "./AdminShell";

function shellElement() {
  return (
    <PreferencesProvider>
      <AdminShell title="Dashboard"><p>Protected content</p></AdminShell>
    </PreferencesProvider>
  );
}

function renderShell() {
  return render(shellElement());
}

describe("AdminShell authentication, hydration, and navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    pathname = "/admin_dashboard";
    replace.mockReset();
    push.mockReset();
    auth.getAccessToken.mockReset();
    auth.getStoredAdminUser.mockReset();
    auth.loadAdminDashboard.mockReset();
    auth.verifyAdminSession.mockReset();
    auth.getStoredAdminUser.mockReturnValue(null);
    auth.loadAdminDashboard.mockResolvedValue({
      admin: {},
      metrics: {},
      insights: { notifications: [], flagged_ai_sessions: [] },
    });
    auth.verifyAdminSession.mockResolvedValue({});
  });

  it("redirects an unauthenticated visitor without fetching protected dashboard data", async () => {
    auth.getAccessToken.mockReturnValue(null);
    renderShell();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/Login"));
    expect(auth.verifyAdminSession).not.toHaveBeenCalled();
    expect(auth.loadAdminDashboard).not.toHaveBeenCalled();
  });

  it("restores the stored administrator without changing the server hydration snapshot", async () => {
    auth.getAccessToken.mockReturnValue("cookie-session");
    auth.getStoredAdminUser.mockReturnValue({ full_name: "Sokha Dara", email: "sokha@example.test" });
    auth.verifyAdminSession.mockReturnValue(new Promise(() => undefined));
    auth.loadAdminDashboard.mockReturnValue(new Promise(() => undefined));

    const serverMarkup = renderToString(shellElement());
    expect(serverMarkup).not.toContain("Sokha Dara");

    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.append(container);
    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, shellElement(), { onRecoverableError });

    await waitFor(() => expect(screen.getAllByText("Sokha Dara").length).toBeGreaterThan(0));
    expect(auth.getStoredAdminUser).toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    container.remove();
  });

  it("opens and closes the mobile drawer with one accessible dialog", async () => {
    auth.getAccessToken.mockReturnValue("cookie-session");
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Close menu" })[1]);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Open menu" })).not.toBeInTheDocument());
  });

  it("does not resurrect an open drawer after routing away and back", async () => {
    auth.getAccessToken.mockReturnValue("cookie-session");
    const view = renderShell();

    const menuButton = screen.getByRole("button", { name: "Open menu" });
    expect(menuButton).toHaveClass("lg:hidden");
    fireEvent.click(menuButton);
    expect(screen.getByRole("dialog", { name: "Open menu" })).toBeInTheDocument();

    pathname = "/ai_reviews";
    view.rerender(shellElement());
    expect(screen.queryByRole("dialog", { name: "Open menu" })).not.toBeInTheDocument();
    await act(async () => undefined);

    pathname = "/admin_dashboard";
    view.rerender(shellElement());
    expect(screen.queryByRole("dialog", { name: "Open menu" })).not.toBeInTheDocument();
  });

  it("marks the route-matching navigation link as current", () => {
    auth.getAccessToken.mockReturnValue("cookie-session");
    pathname = "/ai_reviews";
    renderShell();

    expect(screen.getByRole("link", { name: "AI Reviews" })).toHaveAttribute("aria-current", "page");
  });
});
