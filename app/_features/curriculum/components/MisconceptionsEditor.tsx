"use client";

export type MisconceptionItem = {
  id: string;
  misconception: string;
  correction: string;
};

interface MisconceptionsEditorProps {
  misconceptions: MisconceptionItem[];
  onMisconceptionsChange: (items: MisconceptionItem[]) => void;
}

export function MisconceptionsEditor({
  misconceptions,
  onMisconceptionsChange,
}: MisconceptionsEditorProps) {
  function addMisconception() {
    onMisconceptionsChange([
      ...misconceptions,
      {
        id: `mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        misconception: "",
        correction: "",
      },
    ]);
  }

  function updateItem(id: string, field: keyof MisconceptionItem, value: string) {
    onMisconceptionsChange(
      misconceptions.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  }

  function removeItem(id: string) {
    onMisconceptionsChange(misconceptions.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Common Student Misconceptions
          </label>
          <p className="text-[11px] text-slate-500">
            Helps the AI tutor proactively identify and gently correct common student errors.
          </p>
        </div>
        <button
          type="button"
          onClick={addMisconception}
          className="rounded border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-bold text-info hover:border-cyan-400 hover:text-cyan-300 transition"
        >
          + Add Misconception
        </button>
      </div>

      <div className="space-y-3">
        {misconceptions.map((item, index) => (
          <div
            key={item.id}
            className="rounded-xl border border-line-strong bg-surface-2 p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">
                Misconception #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs text-red-400 hover:text-red-300 font-bold"
              >
                Remove
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Common Student Mistake
              </label>
              <input
                value={item.misconception}
                onChange={(e) => updateItem(item.id, "misconception", e.target.value)}
                placeholder="e.g. Confusing incident angle with angle to surface rather than normal..."
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-fg outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Pedagogical Correction
              </label>
              <input
                value={item.correction}
                onChange={(e) => updateItem(item.id, "correction", e.target.value)}
                placeholder="e.g. Angles are always measured from the normal line (perpendicular to surface)..."
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-slate-200 outline-none focus:border-brand"
              />
            </div>
          </div>
        ))}

        {misconceptions.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface/40 p-4 text-center text-xs text-slate-500">
            No common misconceptions recorded yet. Click &ldquo;+ Add Misconception&rdquo; to guide student hints.
          </div>
        )}
      </div>
    </div>
  );
}
