"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  importAdminCurriculum,
  type AdminCurriculumImportPreview,
  type AdminCurriculumImportResult,
} from "../../auth/adminAuth";

type BulkImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
};

export function BulkImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<unknown[] | null>(null);
  const [preview, setPreview] = useState<AdminCurriculumImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResult, setImportResult] = useState<AdminCurriculumImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function resetState() {
    setFile(null);
    setDataset(null);
    setPreview(null);
    setError(null);
    setIsParsing(false);
    setIsImporting(false);
    setImportResult(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function processFile(selectedFile: File) {
    setError(null);
    setFile(selectedFile);
    setIsParsing(true);
    setPreview(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let parsedItems: unknown[] = [];

        if (selectedFile.name.endsWith(".jsonl")) {
          const lines = text.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              parsedItems.push(JSON.parse(trimmed));
            } catch {
              // skip malformed line
            }
          }
        } else {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            parsedItems = json;
          } else if (json && typeof json === "object") {
            parsedItems = Array.isArray(json.chunks)
              ? json.chunks
              : Array.isArray(json.dataset)
                ? json.dataset
                : Array.isArray(json.items)
                  ? json.items
                  : [json];
          }
        }

        if (parsedItems.length === 0) {
          throw new Error("File did not contain any recognizable curriculum items or chunks.");
        }

        setDataset(parsedItems);

        // Fetch validation preview from backend
        const previewResponse = (await importAdminCurriculum(
          parsedItems,
          false
        )) as AdminCurriculumImportPreview;

        setPreview(previewResponse);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to parse curriculum file"
        );
        setDataset(null);
        setPreview(null);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsParsing(false);
    };

    reader.readAsText(selectedFile);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.name.endsWith(".json") || f.name.endsWith(".jsonl")) {
        processFile(f);
      } else {
        setError("Please drop a valid .json or .jsonl curriculum file.");
      }
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  async function handleConfirmImport() {
    if (!dataset || dataset.length === 0) return;
    setIsImporting(true);
    setError(null);

    try {
      const result = (await importAdminCurriculum(
        dataset,
        true
      )) as AdminCurriculumImportResult;

      setImportResult(result);
      setTimeout(() => {
        onImportSuccess();
      }, 1200);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during curriculum import"
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-canvas px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-base font-bold text-white shadow-md shadow-blue-900/40">
              📥
            </span>
            <div>
              <h2 className="text-lg font-bold text-fg">
                Bulk Import MoEYS Curriculum
              </h2>
              <p className="text-xs text-slate-400">
                Upload official Grade 10–12 syllabus files (.json / .jsonl) to populate topics, formulas, and Khmer terms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-400 hover:border-slate-500 hover:text-fg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-sm text-rose-300">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-rose-200">Import Error</p>
                <p className="mt-0.5 text-xs text-rose-300/90">{error}</p>
              </div>
            </div>
          )}

          {importResult ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-800/50 bg-emerald-950/30 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-bold text-fg">
                Curriculum Imported Successfully!
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                MoEYS syllabus records are now active in the database.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-line bg-surface-2 p-3">
                  <p className="text-xs text-slate-400">Grades</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {importResult.gradesUpserted}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface-2 p-3">
                  <p className="text-xs text-slate-400">Subjects</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {importResult.subjectsUpserted}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface-2 p-3">
                  <p className="text-xs text-slate-400">Topics</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {importResult.topicsUpserted}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface-2 p-3">
                  <p className="text-xs text-slate-400">Lessons/Content</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {importResult.contentUpserted}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
                  isDragOver
                    ? "border-brand bg-brand/10"
                    : "border-line bg-canvas hover:border-brand/60 hover:bg-surface-2"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.jsonl"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-2xl text-accent-fg shadow-inner">
                  📄
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-200">
                  {file ? file.name : "Drag & drop your syllabus file here"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supports .json or .jsonl datasets (MoEYS Grade 10–12 STEM)
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-lg border border-line-strong bg-surface-2 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:border-brand hover:text-fg"
                >
                  Browse Files
                </button>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-3 py-6 text-sm text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  Validating syllabus dataset...
                </div>
              )}

              {/* Validation Preview Card */}
              {preview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-fg flex items-center gap-2">
                      <span>Validation Preview</span>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        ✓ {preview.validCount} valid items
                      </span>
                      {preview.invalidCount > 0 && (
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                          {preview.invalidCount} issues
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="rounded-lg border border-line bg-canvas p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">Grades</p>
                      <p className="mt-1 text-sm font-bold text-fg">
                        {preview.summary.grades.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-canvas p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">Subjects</p>
                      <p className="mt-1 text-sm font-bold text-fg">
                        {preview.summary.subjects.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-canvas p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">Topics</p>
                      <p className="mt-1 text-base font-bold text-accent-fg">
                        {preview.summary.topicsCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-canvas p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">Formulas</p>
                      <p className="mt-1 text-base font-bold text-violet-300">
                        {preview.summary.totalFormulas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-canvas p-3 text-center">
                      <p className="text-[11px] font-medium text-slate-400">Khmer Terms</p>
                      <p className="mt-1 text-base font-bold text-emerald-400">
                        {preview.summary.totalKhmerTerms}
                      </p>
                    </div>
                  </div>

                  {/* Sample Records List */}
                  <div className="rounded-xl border border-line bg-canvas p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sample Topics to be Imported
                    </p>
                    <div className="mt-3 divide-y divide-line/60">
                      {preview.sample.map((sample, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200">
                              {sample.topic}
                            </span>
                            <span className="ml-2 text-slate-500">
                              ({sample.subtopic})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-slate-300">
                              {sample.grade} · {sample.subject}
                            </span>
                            <span className="text-violet-300">
                              {sample.formulaCount} formulas
                            </span>
                            <span className="text-emerald-400">
                              {sample.khmerTermCount} terms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-line bg-canvas px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-line-strong bg-surface-2 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-fg"
          >
            {importResult ? "Done" : "Cancel"}
          </button>
          {!importResult && (
            <button
              type="button"
              disabled={!preview || isImporting || isParsing}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importing Curriculum...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Confirm & Import to Curriculum
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
