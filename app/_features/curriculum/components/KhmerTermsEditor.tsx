"use client";

export type KhmerTermItem = {
  id: string;
  english: string;
  khmer: string;
};

interface KhmerTermsEditorProps {
  terms: KhmerTermItem[];
  onTermsChange: (terms: KhmerTermItem[]) => void;
}

export function KhmerTermsEditor({ terms, onTermsChange }: KhmerTermsEditorProps) {
  function addTerm(english = "", khmer = "") {
    onTermsChange([
      ...terms,
      {
        id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        english,
        khmer,
      },
    ]);
  }

  function updateTerm(id: string, field: keyof KhmerTermItem, value: string) {
    onTermsChange(
      terms.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  }

  function removeTerm(id: string) {
    onTermsChange(terms.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Khmer Vocabulary Dictionary (វាក្យសព្ទខ្មែរ)
          </label>
          <p className="text-[11px] text-slate-500">
            Pairs technical English terms with standard MoEYS Khmer terminology for bilingual explanations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addTerm()}
          className="rounded border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-bold text-info hover:border-cyan-400 hover:text-cyan-300 transition"
        >
          + Add Khmer Term
        </button>
      </div>

      <div className="space-y-2">
        {terms.map((term) => (
          <div
            key={term.id}
            className="grid gap-2 rounded-lg border border-line-strong bg-surface-2 p-2.5 sm:grid-cols-[1fr_24px_1fr_34px]"
          >
            <input
              value={term.english}
              onChange={(e) => updateTerm(term.id, "english", e.target.value)}
              placeholder="English (e.g. refraction)"
              className="h-9 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-fg outline-none placeholder:text-slate-600 focus:border-brand"
            />
            <div className="flex items-center justify-center text-xs font-bold text-slate-500">
              →
            </div>
            <input
              value={term.khmer}
              onChange={(e) => updateTerm(term.id, "khmer", e.target.value)}
              placeholder="Khmer (e.g. ចំណាំងបែរ)"
              className="h-9 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-info outline-none placeholder:text-slate-600 focus:border-brand"
            />
            <button
              type="button"
              onClick={() => removeTerm(term.id)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-sm text-slate-400 hover:border-red-500 hover:text-red-400 transition"
              title="Remove term"
            >
              ✕
            </button>
          </div>
        ))}

        {terms.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface/40 p-4 text-center text-xs text-slate-500">
            No Khmer terms added yet. Required for bilingual tutoring to Grade 10–12 Cambodian students.
          </div>
        )}
      </div>
    </div>
  );
}
