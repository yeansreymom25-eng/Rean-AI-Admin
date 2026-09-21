"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "../_features/admin/AdminShell";
import { decideAdminAiReview, loadAdminAiReviews, type AdminAiReview } from "../_features/auth/adminAuth";

type Decision = "mark_reviewed" | "resolve" | "escalate" | "restrict_student" | "restore_student_access";
const labels: Record<string, string> = { pending: "Pending", triaged: "Reviewed", resolved: "Resolved", escalated: "Escalated" };
const studentId = (review: AdminAiReview) => review.student_id ? `STU-${review.student_id.slice(0, 8)}` : "No student";
const dateText = (value: string | null) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Unknown time";

export default function AiReviewsPage() {
  return <Suspense fallback={<ReviewPageFallback />}><AiReviewsContent /></Suspense>;
}

function AiReviewsContent() {
  const params = useSearchParams();
  const requestedStudent = params.get("student") ?? "";
  const [reviews, setReviews] = useState<AdminAiReview[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminAiReview | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setReviews(await loadAdminAiReviews()); setError(""); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load AI reviews"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // Defer the initial fetch so this effect subscribes to an external request
    // rather than synchronously scheduling state updates during React commit.
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const text = [review.review_id, studentId(review), review.reason, review.evidence, review.grade_level_id, review.subject_id, review.topic_id].filter(Boolean).join(" ").toLowerCase();
      return (!requestedStudent || studentId(review) === requestedStudent) &&
        (severity === "all" || review.severity === severity) &&
        (status === "all" || review.status === status) && (!query || text.includes(query));
    });
  }, [requestedStudent, reviews, search, severity, status]);

  return <AdminShell active="Dashboard" title="AI Review Queue" subtitle="Redacted student reports and flagged Tutor sessions.">
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-extrabold text-fg">Safety review</h2><p className="mt-1 text-sm text-slate-400">Only student-safe evidence is shown. Every decision is audited.</p></div><p className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-accent-fg">{filtered.length} items</p></div>
      {requestedStudent && <p className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">Showing review history for {requestedStudent}. Select an item to review or change access.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
      <div className="mt-5 grid gap-3 md:grid-cols-4"><input aria-label="Search review queue" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search safe evidence or ID" className="h-11 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand" /><Filter label="Severity" value={severity} values={["all", "amber", "red"]} onChange={setSeverity} /><Filter label="Status" value={status} values={["all", "pending", "triaged", "escalated", "resolved"]} onChange={setStatus} /><button onClick={() => void reload()} disabled={loading} className="h-11 rounded-lg border border-line-strong bg-surface-2 text-sm font-bold text-slate-200 hover:border-cyan-400 disabled:opacity-50">{loading ? "Loading…" : "Refresh queue"}</button></div>
    </section>
    <section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Severity</th><th className="px-5 py-4">Reason & student</th><th className="px-5 py-4">Learning context</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-line">{loading ? <Empty text="Loading redacted review items…" /> : filtered.length === 0 ? <Empty text="No review items match these filters." /> : filtered.map((review) => <tr key={review.review_id} className="transition hover:bg-surface-2/60"><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${review.severity === "red" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`}>{review.severity === "red" ? "High" : "Medium"}</span></td><td className="px-5 py-4"><p className="font-bold text-fg">{review.reason ?? "Reported Tutor response"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{studentId(review)}</p></td><td className="px-5 py-4 text-slate-300">{[review.grade_level_id, review.subject_id, review.topic_id].filter(Boolean).join(" · ") || "No curriculum context"}</td><td className="px-5 py-4 text-slate-400">{dateText(review.created_at)}</td><td className="px-5 py-4"><span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-bold text-slate-200">{labels[review.status] ?? review.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setSelected(review)} className="rounded-lg border border-line-strong px-3 py-2 text-xs font-bold text-cyan-200 hover:border-cyan-300">Open review</button></td></tr>)}</tbody></table></div></section>
    {selected && <ReviewDrawer review={selected} onClose={() => setSelected(null)} onComplete={reload} onError={setError} />}
  </AdminShell>;
}

function ReviewPageFallback() {
  return <AdminShell active="Dashboard" title="AI Review Queue" subtitle="Loading safety reviews."><section className="rounded-xl border border-line bg-surface p-8 text-sm font-semibold text-slate-400">Loading review queue…</section></AdminShell>;
}

function Filter({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) { return <label className="text-xs font-bold text-slate-400">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand">{values.map((item) => <option key={item} value={item}>{item === "all" ? `All ${label.toLowerCase()}s` : labels[item] ?? item}</option>)}</select></label>; }
function Empty({ text }: { text: string }) { return <tr><td colSpan={6} className="px-5 py-12 text-center font-semibold text-slate-500">{text}</td></tr>; }

function ReviewDrawer({ review, onClose, onComplete, onError }: { review: AdminAiReview; onClose: () => void; onComplete: () => Promise<void>; onError: (message: string) => void }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = async () => {
    if (!decision) return;
    if ((decision === "restrict_student" || decision === "escalate") && !note.trim()) { onError("A short reason is required for this safety action."); return; }
    setSaving(true);
    try { await decideAdminAiReview(review.review_id, decision, crypto.randomUUID(), note.trim() || undefined); setDecision(null); setNote(""); await onComplete(); }
    catch (actionError) { onError(actionError instanceof Error ? actionError.message : "Review action failed"); }
    finally { setSaving(false); }
  };
  return <div role="dialog" aria-modal="true" aria-label="AI review detail" className="fixed inset-0 z-50 flex justify-end bg-overlay" onMouseDown={onClose}><section className="h-full w-full max-w-xl overflow-y-auto border-l border-line bg-surface p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{studentId(review)}</p><h2 className="mt-1 text-xl font-extrabold text-fg">{decision ? "Confirm review decision" : "Review detail"}</h2></div><button onClick={onClose} className="rounded-lg border border-line-strong px-3 py-2 text-sm font-bold text-slate-200">Close</button></div><dl className="mt-7 space-y-5 text-sm"><Detail label="Reason" value={review.reason ?? "Reported Tutor response"} /><Detail label="Curriculum context" value={[review.grade_level_id, review.subject_id, review.topic_id].filter(Boolean).join(" · ") || "No curriculum context"} /><Detail label="Reported at" value={dateText(review.created_at)} /><Detail label="Redacted evidence" value={review.evidence ?? "No student note was provided."} /></dl>{decision ? <div className="mt-7 rounded-xl border border-line-strong bg-surface-2 p-4"><p className="text-sm font-bold text-fg">{decision === "restrict_student" ? "This blocks the student’s Tutor features immediately. A reason is required." : "This decision is recorded in the review audit trail."}</p><label className="mt-4 block text-xs font-bold text-slate-400">Admin reason{decision === "restrict_student" || decision === "escalate" ? " (required)" : " (optional)"}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} className="mt-2 min-h-24 w-full rounded-lg border border-line-strong bg-surface p-3 text-sm text-fg outline-none focus:border-cyan-300" placeholder="Write a concise, student-safe reason…" /></label><div className="mt-4 flex justify-end gap-3"><button onClick={() => setDecision(null)} disabled={saving} className="rounded-lg border border-line-strong px-3 py-2 text-sm font-bold text-slate-200">Back</button><button onClick={() => void confirm()} disabled={saving} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-extrabold text-[#07111e] disabled:opacity-50">{saving ? "Saving…" : "Confirm decision"}</button></div></div> : <div className="mt-7 grid grid-cols-2 gap-3"><Action label="Mark reviewed" onClick={() => setDecision("mark_reviewed")} /><Action label="Resolve" onClick={() => setDecision("resolve")} /><Action label="Escalate" onClick={() => setDecision("escalate")} /><Action label="Restrict student" danger onClick={() => setDecision("restrict_student")} /><Action label="Restore access" onClick={() => setDecision("restore_student_access")} /></div>}</section></div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-200">{value}</dd></div>; }
function Action({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`rounded-lg border px-3 py-2.5 text-sm font-bold ${danger ? "border-rose-500/50 text-rose-200 hover:bg-rose-500/10" : "border-line-strong text-slate-200 hover:border-cyan-300"}`}>{label}</button>; }
