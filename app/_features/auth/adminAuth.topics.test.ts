import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

function topic(overrides: Record<string, unknown> = {}) {
  return {
    id: "topic-1",
    topic_id: "topic-1",
    grade_level_id: "grade-10",
    subject_id: "math-10",
    grade: "Grade 10",
    subject: "Mathematics",
    name: "Linear Equations",
    khmer: "សមីការលីនេអ៊ែរ",
    code: "MAT-10-01",
    description: "Solve one-variable equations.",
    learning_objectives: ["Solve linear equations"],
    difficulty: "Beginner",
    prerequisites: [],
    status: "Draft",
    created_at: null,
    updated_at: null,
    created_by: "admin-1",
    updated_by: "admin-1",
    ...overrides,
  };
}

describe("Admin Topic API client", () => {
  beforeEach(() => {
    storage.clear();
    storage.set("rean_admin_cookie_session", "active");
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads persisted topic fields and forwards filtering", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { topics: [topic()] },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const api = await import("./adminAuth");

    await expect(api.loadAdminTopics({ grade_level_id: "grade-10", subject_id: "math-10" }))
      .resolves.toEqual([topic()]);
    expect(fetchMock.mock.calls[0][0]).toContain("grade_level_id=grade-10");
    expect(fetchMock.mock.calls[0][0]).toContain("subject_id=math-10");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("persists create, edit, and non-destructive deactivate requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: topic(),
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const api = await import("./adminAuth");
    const input = {
      grade_level_id: "grade-10",
      subject_id: "math-10",
      name: "Linear Equations",
      code: "MAT-10-01",
      status: "Draft" as const,
    };

    await api.createAdminTopic(input);
    await api.updateAdminTopic("topic-1", { name: "Linear Equations II" });
    await api.deactivateAdminTopic("topic-1", "Archived");

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1].method])).toEqual([
      ["http://localhost:4000/api/v1/admin/curriculum/topics", "POST"],
      ["http://localhost:4000/api/v1/admin/curriculum/topics/topic-1", "PUT"],
      ["http://localhost:4000/api/v1/admin/curriculum/topics/topic-1/status", "PATCH"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ status: "Archived" });
  });

  it("uses the protected, redacted AI review API and sends an idempotent decision", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: {
          reviews: [{
            review_id: "review-1",
            tutor_session_id: "session-1",
            student_id: "student-1",
            grade_level_id: "grade-10",
            subject_id: "math",
            topic_id: "linear-equations",
            reason: "unsafe_unhelpful",
            severity: "red",
            status: "pending",
            evidence: "The explanation skipped a step.",
            created_at: "2026-08-24T00:00:00.000Z",
          }],
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const api = await import("./adminAuth");

    const reviews = await api.loadAdminAiReviews();
    await api.decideAdminAiReview("review-1", "restrict_student", "decision-1", "Safety review");

    expect(reviews[0]).toEqual(expect.objectContaining({
      review_id: "review-1",
      evidence: "The explanation skipped a step.",
    }));
    expect(reviews[0]).not.toHaveProperty("chain_of_thought");
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1].method])).toEqual([
      ["http://localhost:4000/api/v1/admin/ai-reviews", undefined],
      ["http://localhost:4000/api/v1/admin/ai-reviews/review-1/decision", "POST"],
    ]);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      decision: "restrict_student",
      idempotency_key: "decision-1",
      note: "Safety review",
    });
  });
});
