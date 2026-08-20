import Image from "next/image";
import Link from "next/link";
import type { ChangeEventHandler, ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b19] px-5 py-8 text-slate-100">
      <section className="w-full max-w-[430px] rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="mb-7 text-center">
          <Image
            src="/AI Tutor_Logo.png"
            alt="Rean AI logo"
            width={104}
            height={104}
            className="mx-auto h-24 w-24 object-contain"
            priority
          />
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        {children}

        {footer && (
          <div className="mt-7 border-t border-[#243856] pt-6 text-center text-sm text-slate-500">
            {footer}
          </div>
        )}
      </section>
    </main>
  );
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  name?: string;
  type?: string;
  placeholder: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase text-slate-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-lg border border-[#7da6e6] bg-[#e8f1ff] px-4 text-sm font-semibold text-[#071226] outline-none transition placeholder:text-[#3e5f91] focus:border-[#5368ff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  href,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const classes =
    "flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110";

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function GoogleButton({
  children,
  href,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes =
    "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#35507a] bg-black text-sm font-bold text-slate-200 transition hover:border-[#5368ff] hover:text-white";

  if (href) {
    return (
      <Link href={href} className={classes}>
        <Image
          src="/Ai tutor_google.png"
          alt=""
          width={22}
          height={22}
          className="h-5 w-5 object-contain"
        />
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      <Image
        src="/Ai tutor_google.png"
        alt=""
        width={22}
        height={22}
        className="h-5 w-5 object-contain"
      />
      {children}
    </button>
  );
}
