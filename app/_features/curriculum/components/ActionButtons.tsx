"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ActionButtonsProps = {
  onEdit: () => void;
  onDuplicate?: () => void;
  onDeactivate?: () => void;
  deactivateLabel?: string;
};

export function ActionButtons({
  onEdit,
  onDuplicate,
  onDeactivate,
  deactivateLabel = "Deactivate",
}: ActionButtonsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function runMenuAction(action?: () => void) {
    action?.();
    setIsMenuOpen(false);
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#243856] bg-[#101a2b] px-3 text-sm font-bold text-slate-300 transition hover:border-[#5368ff] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5368ff]/45"
      >
        <EditIcon />
        Edit
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="More actions"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#243856] bg-[#101a2b] text-slate-400 transition hover:border-[#5368ff] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5368ff]/45"
        >
          <MoreIcon />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-lg border border-[#243856] bg-[#0b1324] py-1 text-left shadow-[0_18px_45px_rgba(0,0,0,0.32)]">
            <MenuButton onClick={() => runMenuAction(onEdit)}>View details</MenuButton>
            <MenuButton onClick={() => runMenuAction(onDuplicate)}>
              Duplicate
            </MenuButton>
            <MenuButton
              danger
              onClick={() => runMenuAction(onDeactivate)}
            >
              {deactivateLabel}
            </MenuButton>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuButton({
  children,
  danger,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm font-semibold transition hover:bg-[#101a2b] ${
        danger ? "text-rose-300 hover:text-rose-200" : "text-slate-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="m14.5 5.5 4 4M4.75 19.25l4.35-.8L18.5 9.05a2.83 2.83 0 0 0-4-4L5.1 14.45l-.35 4.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 12h.01M12 12h.01M17.5 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}
