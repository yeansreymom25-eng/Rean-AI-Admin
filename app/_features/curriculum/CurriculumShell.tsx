"use client";

import type { ReactNode } from "react";
import { AdminShell } from "../admin/AdminShell";
import { Icon } from "../admin/Icon";

type CurriculumShellProps = {
  active: "Grades" | "Subjects" | "Topics" | "Content" | "Versions";
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children: ReactNode;
};

/** Curriculum pages share the admin shell and add a search box plus page actions. */
export function CurriculumShell({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
}: CurriculumShellProps) {
  const hasActions = Boolean(searchPlaceholder || actionLabel || secondaryActionLabel);

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      action={
        hasActions ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            {searchPlaceholder && (
              <label className="relative block sm:flex-1 md:flex-none">
                <span className="sr-only">{searchPlaceholder}</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="search" className="h-4 w-4" />
                </span>
                <input
                  type="search"
                  className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-fg outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 md:w-[280px]"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                />
              </label>
            )}
            {secondaryActionLabel && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition hover:border-line-strong hover:bg-surface-2"
              >
                <Icon name="upload" className="h-4 w-4" />
                {secondaryActionLabel}
              </button>
            )}
            {actionLabel && (
              <button
                type="button"
                onClick={onAction}
                className="flex h-10 items-center justify-center gap-2 rounded-lg brand-gradient px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                {actionLabel}
              </button>
            )}
          </div>
        ) : undefined
      }
    >
      {children}
    </AdminShell>
  );
}
