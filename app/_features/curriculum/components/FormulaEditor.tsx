"use client";

import { KatexPreview } from "./KatexPreview";

export type FormulaVariable = {
  id: string;
  symbol: string;
  meaning: string;
  unit: string;
};

interface FormulaEditorProps {
  expression: string;
  onExpressionChange: (expression: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  variables: FormulaVariable[];
  onVariablesChange: (variables: FormulaVariable[]) => void;
}

const QUICK_MATH_SNIPPETS = [
  { label: "Fraction", snippet: "\\frac{a}{b}" },
  { label: "Square Root", snippet: "\\sqrt{x}" },
  { label: "Exponent", snippet: "x^{2}" },
  { label: "Subscript", snippet: "n_{1}" },
  { label: "Sin", snippet: "\\sin(\\theta)" },
  { label: "Cos", snippet: "\\cos(\\theta)" },
  { label: "Delta", snippet: "\\Delta" },
  { label: "Pi", snippet: "\\pi" },
  { label: "Arrow", snippet: "\\rightarrow" },
  { label: "Times", snippet: "\\times" },
];

export function FormulaEditor({
  expression,
  onExpressionChange,
  description,
  onDescriptionChange,
  variables,
  onVariablesChange,
}: FormulaEditorProps) {
  function addVariable() {
    onVariablesChange([
      ...variables,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        symbol: "",
        meaning: "",
        unit: "",
      },
    ]);
  }

  function updateVariable(id: string, field: keyof FormulaVariable, value: string) {
    onVariablesChange(
      variables.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  }

  function removeVariable(id: string) {
    onVariablesChange(variables.filter((v) => v.id !== id));
  }

  function insertSnippet(snippet: string) {
    const next = expression ? `${expression} ${snippet}` : snippet;
    onExpressionChange(next);
  }

  return (
    <div className="space-y-6">
      {/* Mathematical Expression with Live KaTeX Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            LaTeX Expression <span className="text-cyan-400">*</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">KaTeX Supported</span>
        </div>

        <input
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder="e.g. n_1 \sin(\theta_1) = n_2 \sin(\theta_2)  or  PV = nRT"
          className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 font-mono text-sm font-bold text-info outline-none transition placeholder:font-sans placeholder:text-slate-500 focus:border-brand"
        />

        {/* Quick Math Snippets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_MATH_SNIPPETS.map(({ label, snippet }) => (
            <button
              key={label}
              type="button"
              onClick={() => insertSnippet(snippet)}
              className="rounded border border-line bg-surface px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition"
            >
              +{label}
            </button>
          ))}
        </div>

        {/* Live Preview Box */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Live Math Preview:</div>
          <KatexPreview latex={expression} placeholder="Type LaTeX above to see rendered formula..." />
        </div>
      </div>

      {/* Description / Principle */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Principle / Formula Name <span className="text-cyan-400">*</span>
        </label>
        <input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g. Snell's Law of Refraction / Fundamental Principle of Dynamics"
          className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-semibold text-fg outline-none transition placeholder:text-slate-500 focus:border-brand"
        />
      </div>

      {/* Variables & Units Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Variable Definitions & SI Units
          </label>
          <button
            type="button"
            onClick={addVariable}
            className="text-xs font-bold text-info hover:underline"
          >
            + Add Variable
          </button>
        </div>

        <div className="space-y-2">
          {variables.map((variable) => (
            <div
              key={variable.id}
              className="grid gap-2 rounded-lg border border-line-strong bg-surface-2 p-2.5 sm:grid-cols-[70px_1fr_90px_34px]"
            >
              <input
                value={variable.symbol}
                onChange={(e) => updateVariable(variable.id, "symbol", e.target.value)}
                placeholder="Symbol (e.g. n1)"
                className="h-9 rounded-md border border-line bg-surface px-2 text-center font-mono text-sm font-bold text-info outline-none focus:border-brand"
              />
              <input
                value={variable.meaning}
                onChange={(e) => updateVariable(variable.id, "meaning", e.target.value)}
                placeholder="Meaning (e.g. Refractive index of medium 1)"
                className="h-9 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-fg outline-none placeholder:text-slate-600 focus:border-brand"
              />
              <input
                value={variable.unit}
                onChange={(e) => updateVariable(variable.id, "unit", e.target.value)}
                placeholder="Unit (e.g. deg, m/s)"
                className="h-9 rounded-md border border-line bg-surface px-2 text-sm font-semibold text-slate-300 outline-none placeholder:text-slate-600 focus:border-brand"
              />
              <button
                type="button"
                onClick={() => removeVariable(variable.id)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-sm text-slate-400 hover:border-red-500 hover:text-red-400 transition"
                title="Remove variable"
              >
                ✕
              </button>
            </div>
          ))}

          {variables.length === 0 && (
            <div className="rounded-lg border border-dashed border-line bg-surface/40 p-4 text-center text-xs text-slate-500">
              No variables defined yet. Click &ldquo;+ Add Variable&rdquo; to define physical symbols, meanings, and units.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
