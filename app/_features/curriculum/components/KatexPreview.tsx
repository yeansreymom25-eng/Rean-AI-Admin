"use client";

import { useMemo } from "react";
import katex from "katex";

interface KatexPreviewProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  placeholder?: string;
}

export function KatexPreview({
  latex,
  displayMode = true,
  className = "",
  placeholder = "LaTeX equation preview will appear here...",
}: KatexPreviewProps) {
  const trimmed = latex.trim();

  const { html, error } = useMemo(() => {
    if (!trimmed) {
      return { html: null, error: null };
    }
    try {
      const rendered = katex.renderToString(trimmed, {
        displayMode,
        throwOnError: true,
        output: "htmlAndMathml",
      });
      return { html: rendered, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { html: null, error: message };
    }
  }, [trimmed, displayMode]);

  if (!trimmed) {
    return (
      <div
        className={`flex min-h-[52px] items-center justify-center rounded-lg border border-dashed border-line bg-surface/50 p-3 text-xs italic text-slate-500 ${className}`}
      >
        {placeholder}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex min-h-[52px] flex-col justify-center rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-300 ${className}`}
      >
        <span className="font-semibold">Incomplete / Invalid LaTeX syntax:</span>
        <span className="font-mono text-[11px] text-amber-400/80">{error}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[52px] items-center justify-center overflow-x-auto rounded-lg border border-line-strong bg-surface p-4 text-center text-fg ${className}`}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
