import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("./CurriculumShell", () => ({
  CurriculumShell: ({ title, actionLabel, onAction, children }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    children: React.ReactNode;
  }) => <main><h1>{title}</h1>{actionLabel && <button onClick={onAction}>{actionLabel}</button>}{children}</main>,
}));

const api = vi.hoisted(() => ({
  compareAdminCurriculumVersion: vi.fn(),
  createAdminCurriculumContent: vi.fn(),
  createAdminCurriculumVersion: vi.fn(),
  deleteAdminCurriculumContent: vi.fn(),
  getAccessToken: vi.fn<() => string | null>(),
  loadAdminCurriculumContent: vi.fn(),
  loadAdminCurriculumVersions: vi.fn(),
  loadAdminGrades: vi.fn(),
  loadAdminSubjects: vi.fn(),
  loadAdminTopics: vi.fn(),
  transitionAdminCurriculumVersion: vi.fn(),
  updateAdminCurriculumContent: vi.fn(),
  clearAdminSession: vi.fn(),
}));
vi.mock("../auth/adminAuth", () => api);

import { ContentPage } from "./ContentPage";
import { CurriculumVersionsPage } from "./CurriculumVersionsPage";

const grade = { id: "g12", grade_level_id: "g12", name: "Grade 12", khmer: "", number: "12", description: "", status: "Active" };
const subject = { id: "physics", subject_id: "physics", grade_level_id: "g12", grade: "Grade 12", name: "Physics", khmer: "", code: "PHY12", icon: "", description: "", order: "1", status: "Active" };
const topic = { id: "newton", topic_id: "newton", grade_level_id: "g12", subject_id: "physics", grade: "Grade 12", subject: "Physics", name: "Newton's Second Law", khmer: "", code: "", description: "", learning_objectives: [], difficulty: "Beginner", prerequisites: [], status: "Draft", created_at: null, updated_at: null, created_by: "admin", updated_by: "admin" };
const version = { curriculum_version_id: "v1", grade_level_id: "g12", subject_id: "physics", label: "2026.1", status: "draft", change_summary: "Initial", created_by: "admin", reviewed_by: null, published_by: null, created_at: null, updated_at: null, reviewed_at: null, published_at: null, rejection_reason: null, revision: 1 };
const formula = {
  id: "formula-1", content_id: "formula-1", curriculum_version_id: "v1", kind: "Formula", grade_level_id: "g12", subject_id: "physics", topic_id: "newton",
  grade: "Grade 12", subject: "Physics", lesson: "Newton's Second Law", subtopic: "Force", title: "", summary: "", body: "", expression: "F = ma", description: "Newton's law",
  variables: [], steps: [], khmerTerms: [{ id: "term-1", english: "force", khmer: "កម្លាំង" }], prerequisites: [], tags: ["mechanics"], status: "Draft",
};

describe("curriculum authoring workflows", () => {
  beforeEach(() => {
    replace.mockReset();
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getAccessToken.mockReturnValue("cookie-session");
    api.loadAdminGrades.mockResolvedValue([grade]);
    api.loadAdminSubjects.mockResolvedValue([subject]);
    api.loadAdminTopics.mockResolvedValue([topic]);
    api.loadAdminCurriculumVersions.mockResolvedValue([version]);
    api.loadAdminCurriculumContent.mockResolvedValue([]);
  });

  it("blocks an empty formula at the real editor quality gate", async () => {
    render(<ContentPage />);
    await screen.findByRole("button", { name: "Add Formula" });
    fireEvent.click(screen.getByRole("button", { name: "Add Formula" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Formula & Steps" }));

    expect(await screen.findAllByText("Formula expression cannot be empty.")).not.toHaveLength(0);
    expect(api.createAdminCurriculumContent).not.toHaveBeenCalled();
  });

  it("edits existing curriculum and sends the changed payload", async () => {
    api.loadAdminCurriculumContent.mockResolvedValue([formula]);
    api.updateAdminCurriculumContent.mockResolvedValue({ ...formula, expression: "F = m a" });
    const user = userEvent.setup();
    render(<ContentPage />);

    const edit = await screen.findByRole("button", { name: "Edit F = ma" });
    await user.click(edit);
    const expression = screen.getByPlaceholderText(/n_1.*PV = nRT/);
    await user.clear(expression);
    await user.type(expression, "F = m a");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(api.updateAdminCurriculumContent).toHaveBeenCalledTimes(1));
    expect(api.updateAdminCurriculumContent).toHaveBeenCalledWith(
      "formula-1",
      expect.objectContaining({ expression: "F = m a", status: "Draft" }),
    );
  });

  it("surfaces create failures without closing the authoring drawer", async () => {
    api.createAdminCurriculumContent.mockRejectedValue(new Error("Publishing service unavailable"));
    const user = userEvent.setup();
    render(<ContentPage />);

    await user.click(await screen.findByRole("button", { name: "Add Formula" }));
    await user.type(screen.getByPlaceholderText(/n_1.*PV = nRT/), "F = ma");
    await user.click(screen.getByRole("button", { name: "Save Formula & Steps" }));

    expect(await screen.findByText("Publishing service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Author STEM Curriculum Content" })).toBeInTheDocument();
  });

  it("requires bilingual vocabulary before publishing", async () => {
    const user = userEvent.setup();
    render(<ContentPage />);
    await user.click(await screen.findByRole("button", { name: "Add Formula" }));
    await user.type(screen.getByPlaceholderText(/n_1.*PV = nRT/), "F = ma");
    await user.click(screen.getByRole("switch"));

    expect(await screen.findAllByText(/Publishing requires at least one English-to-Khmer vocabulary term/)).not.toHaveLength(0);
    expect(api.createAdminCurriculumContent).not.toHaveBeenCalled();
  });
});

describe("curriculum version publishing", () => {
  beforeEach(() => {
    replace.mockReset();
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getAccessToken.mockReturnValue("cookie-session");
    api.loadAdminGrades.mockResolvedValue([grade]);
    api.loadAdminSubjects.mockResolvedValue([subject]);
    api.loadAdminCurriculumVersions.mockResolvedValue([{ ...version, status: "in_review" }]);
  });

  it("creates a draft from the selected grade and subject", async () => {
    api.createAdminCurriculumVersion.mockResolvedValue(version);
    const user = userEvent.setup();
    render(<CurriculumVersionsPage />);
    await screen.findByText("2026.1");
    await user.type(screen.getByPlaceholderText("Version label, e.g. 2026.1"), "2026.2");
    await user.type(screen.getByPlaceholderText("Change summary"), "Add mechanics examples");
    await user.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(api.createAdminCurriculumVersion).toHaveBeenCalledWith({
      grade_level_id: "g12", subject_id: "physics", label: "2026.2", change_summary: "Add mechanics examples",
    }));
    expect(await screen.findByText("Draft version created.")).toBeInTheDocument();
  });

  it("publishes an in-review version and reports transition failures", async () => {
    const user = userEvent.setup();
    api.transitionAdminCurriculumVersion.mockResolvedValueOnce({ ...version, status: "published" });
    render(<CurriculumVersionsPage />);
    await user.click(await screen.findByRole("button", { name: "Publish" }));
    await waitFor(() => expect(api.transitionAdminCurriculumVersion).toHaveBeenCalledWith("v1", "publish", expect.stringMatching(/^admin-version-/), undefined));
    expect(await screen.findByText("Version publish completed.")).toBeInTheDocument();

    api.transitionAdminCurriculumVersion.mockRejectedValueOnce(new Error("Publication conflict"));
    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(await screen.findByText("Publication conflict")).toBeInTheDocument();
  });
});
