import type { ReactNode } from "react";

const statusClasses: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Draft: "bg-amber-500/15 text-amber-300",
  Inactive: "bg-rose-500/15 text-rose-300",
};

export function DataSurface({
  children,
  footer,
}: {
  children: ReactNode;
  footer: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">{children}</div>
      <div className="flex flex-col gap-4 border-t border-[#243856] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-600">{footer}</p>
        <div className="flex gap-2">
          {["<", "1", "2", ">"].map((item) => (
            <button
              key={item}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#243856] px-2 text-sm font-bold transition hover:border-[#5368ff] hover:text-white ${
                item === "1"
                  ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white"
                  : "bg-[#0b1324] text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        statusClasses[status] ?? statusClasses.Active
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyCurriculumState({ label }: { label: string }) {
  return (
    <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-semibold text-slate-500">
        {label} management will use the same table, search, and popup pattern.
      </p>
    </section>
  );
}

export function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <button
        className="absolute inset-0 cursor-default"
        aria-label={`Close ${title} panel`}
        onClick={onClose}
      />
      <aside className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#35507a] bg-[#0b1324] shadow-[0_30px_90px_rgba(0,0,0,0.48)]">
        <div className="flex h-20 items-center justify-between border-b border-[#243856] bg-[#101a2b] px-7">
          <h2 className="text-xl font-bold tracking-tight text-slate-50">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#243856] text-2xl leading-none text-slate-500 transition hover:border-[#5368ff] hover:bg-[#0b1324] hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </aside>
    </div>
  );
}

export function Field({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function TextArea({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <textarea
        className="min-h-28 w-full resize-none rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function StatusToggle() {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[#3b5d8f] bg-[#101a2b] p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-50">Status</span>
        <span className="text-xs font-medium text-slate-400">
          Visible to students and teachers
        </span>
      </span>
      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#5368ff]" />
    </label>
  );
}

export function DrawerActions({
  primaryLabel,
  onClose,
}: {
  primaryLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] p-6">
      <button
        type="button"
        onClick={onClose}
        className="h-12 rounded-lg border border-[#3b5d8f] bg-[#101a2b] text-sm font-bold text-slate-100 transition hover:border-[#6f7cff] hover:bg-[#0b1324]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onClose}
        className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

export function NotificationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15.5 17.5h-7a2 2 0 0 1-1.7-3.05l.5-.8A4.6 4.6 0 0 0 8 11.2V9.5a4 4 0 0 1 8 0v1.7c0 .87.24 1.72.7 2.45l.5.8a2 2 0 0 1-1.7 3.05Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 19a2.2 2.2 0 0 0 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
