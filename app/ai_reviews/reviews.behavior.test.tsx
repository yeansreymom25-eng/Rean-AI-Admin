import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let requestedStudent = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(requestedStudent ? `student=${requestedStudent}` : ""),
}));
vi.mock("../_features/admin/AdminShell", () => ({
  AdminShell: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));

const api = vi.hoisted(() => ({
  decideAdminAiReview: vi.fn(),
  loadAdminAiReviews: vi.fn(),
}));
vi.mock("../_features/auth/adminAuth", () => api);

import AiReviewsPage from "./page";

const amberReview = {
  review_id: "review-1", tutor_session_id: "session-1", student_id: "student-123456789", grade_level_id: "Grade 12",
  subject_id: "Physics", topic_id: "Kinematics", reason: "Unsupported answer", severity: "amber", status: "pending",
  evidence: "The response needs deterministic verification.", created_at: "2026-09-01T00:00:00.000Z",
};
const redReview = { ...amberReview, review_id: "review-2", student_id: "danger-123456789", reason: "Safety escalation", severity: "red", status: "escalated" };

describe("AI review and telemetry-facing states", () => {
  beforeEach(() => {
    requestedStudent = "";
    api.decideAdminAiReview.mockReset();
    api.loadAdminAiReviews.mockReset();
  });

  it("shows a loading state while the redacted review request is pending", async () => {
    api.loadAdminAiReviews.mockReturnValue(new Promise(() => undefined));
    render(<AiReviewsPage />);

    expect(screen.getByText("Loading redacted review items…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
    await waitFor(() => expect(api.loadAdminAiReviews).toHaveBeenCalledTimes(1));
  });

  it("distinguishes an empty queue from loading", async () => {
    api.loadAdminAiReviews.mockResolvedValue([]);
    render(<AiReviewsPage />);

    expect(await screen.findByText("No review items match these filters.")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.queryByText("Loading redacted review items…")).not.toBeInTheDocument();
  });

  it("shows permission-denied failures rather than an empty queue", async () => {
    api.loadAdminAiReviews.mockRejectedValue(new Error("Admin access is required"));
    render(<AiReviewsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Admin access is required");
  });

  it("filters review telemetry by severity and search text", async () => {
    api.loadAdminAiReviews.mockResolvedValue([amberReview, redReview]);
    const user = userEvent.setup();
    render(<AiReviewsPage />);
    await screen.findByText("Unsupported answer");

    await user.selectOptions(screen.getByLabelText("Severity"), "red");
    expect(screen.queryByText("Unsupported answer")).not.toBeInTheDocument();
    expect(screen.getByText("Safety escalation")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search review queue"), "nothing matches");
    expect(screen.getByText("No review items match these filters.")).toBeInTheDocument();
  });

  it("requires an explanation before a restrictive decision is sent", async () => {
    api.loadAdminAiReviews.mockResolvedValue([redReview]);
    render(<AiReviewsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Open review" }));
    fireEvent.click(screen.getByRole("button", { name: "Restrict student" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm decision" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A short reason is required");
    expect(api.decideAdminAiReview).not.toHaveBeenCalled();
  });
});
