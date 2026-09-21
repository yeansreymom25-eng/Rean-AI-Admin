"use client";

import { KatexPreview } from "./KatexPreview";

export type WorkedStep = {
  id: string;
  heading: string;
  explanation: string;
  latex?: string;
};

interface WorkedStepsEditorProps {
  steps: WorkedStep[];
  onStepsChange: (steps: WorkedStep[]) => void;
}

export function WorkedStepsEditor({ steps, onStepsChange }: WorkedStepsEditorProps) {
  function addStep() {
    const nextIndex = steps.length + 1;
    onStepsChange([
      ...steps,
      {
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        heading: `Step ${nextIndex} · Solution phase`,
        explanation: "",
        latex: "",
      },
    ]);
  }

  function updateStep(id: string, field: keyof WorkedStep, value: string) {
    onStepsChange(
      steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function removeStep(id: string) {
    onStepsChange(steps.filter((s) => s.id !== id));
  }

  function moveStep(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onStepsChange(reordered);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Worked Solution Steps (Blueprint)
          </label>
          <p className="text-[11px] text-slate-500">
            Define the multi-step pedagogical derivation used by the whiteboard AI tutor.
          </p>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="rounded border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-bold text-info hover:border-cyan-400 hover:text-cyan-300 transition"
        >
          + Add Step
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="rounded-xl border border-line-strong bg-surface-2 p-4 space-y-3"
          >
            {/* Header: Step Number, Move & Remove */}
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-extrabold text-cyan-400">
                Step {index + 1} of {steps.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveStep(index, "up")}
                  className="px-2 py-0.5 text-xs text-slate-400 disabled:opacity-30 hover:text-fg"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, "down")}
                  className="px-2 py-0.5 text-xs text-slate-400 disabled:opacity-30 hover:text-fg"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="ml-2 text-xs text-red-400 hover:text-red-300 font-bold"
                  title="Remove Step"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Step Heading */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Step Title / Phase
              </label>
              <input
                value={step.heading}
                onChange={(e) => updateStep(step.id, "heading", e.target.value)}
                placeholder="e.g. Step 1 · Identify given quantities and choose formula"
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-fg outline-none focus:border-brand"
              />
            </div>

            {/* Step Pedagogical Explanation */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Pedagogical Explanation
              </label>
              <textarea
                value={step.explanation}
                onChange={(e) => updateStep(step.id, "explanation", e.target.value)}
                placeholder="Explain the mathematical or scientific reasoning for this step..."
                rows={2}
                className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-slate-200 outline-none focus:border-brand"
              />
            </div>

            {/* Step Equation (LaTeX) & Live Preview */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                Mathematical Equation (LaTeX)
              </label>
              <input
                value={step.latex ?? ""}
                onChange={(e) => updateStep(step.id, "latex", e.target.value)}
                placeholder="e.g. \sin(\theta_2) = \frac{n_1 \sin(\theta_1)}{n_2}  or  v = 0 + 2(5) = 10\text{ m/s}"
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm font-bold text-info outline-none focus:border-brand"
              />
              {step.latex && step.latex.trim() && (
                <div className="mt-2">
                  <KatexPreview
                    latex={step.latex}
                    placeholder="Step LaTeX preview..."
                    className="min-h-[44px] py-2"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {steps.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-surface/40 p-6 text-center text-xs text-slate-500">
            No solution steps added yet. Click &ldquo;+ Add Step&rdquo; to build the multi-step whiteboard blueprint.
          </div>
        )}
      </div>
    </div>
  );
}
