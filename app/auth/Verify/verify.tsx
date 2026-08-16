import Link from "next/link";
import { AuthShell, PrimaryButton } from "../AuthShell";

export default function VerifyPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your email to finish securing your account."
      footer={
        <>
          Did not receive a code?{" "}
          <button className="font-bold text-[#5368ff]">Send again</button>
        </>
      }
    >
      <form action="/admin_dashboard" method="get" className="space-y-6">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase text-slate-500">
            Verification code
          </span>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${index + 1}`}
                className="h-12 rounded-lg border border-[#35507a] bg-black text-center text-lg font-extrabold text-white outline-none transition focus:border-[#5368ff]"
              />
            ))}
          </div>
        </div>

        <PrimaryButton type="submit">Verify account</PrimaryButton>
      </form>

      <div className="mt-5 text-center">
        <Link href="/auth/Login" className="text-sm font-bold text-slate-500">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
