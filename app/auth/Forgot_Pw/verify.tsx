import Image from "next/image";
import Link from "next/link";

export default function VerifyPasswordReset() {
  return (
    <main className="min-h-screen bg-[#070b19] px-5 py-8 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="mb-8 text-center">
            <Image
              src="/AI Tutor_Logo.png"
              alt="Rean AI logo"
              width={82}
              height={82}
              className="mx-auto h-20 w-20 object-contain"
              priority
            />
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
              Verify Code
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          <form className="space-y-5">
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  aria-label={`Verification digit ${index + 1}`}
                  maxLength={1}
                  className="aspect-square rounded-lg border border-[#35507a] bg-black text-center text-lg font-semibold text-white outline-none focus:border-[#5368ff]"
                />
              ))}
            </div>

            <button className="h-12 w-full rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-semibold text-white shadow-lg shadow-blue-950/30">
              Verify Code
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Did not receive a code?{" "}
            <button className="font-medium text-[#5368ff]">Resend</button>
          </p>

          <Link
            href="/Forgot_Pw"
            className="mt-5 flex h-12 w-full items-center justify-center rounded-lg border border-[#35507a] bg-black text-sm font-semibold text-white transition hover:border-[#5368ff]"
          >
            Back to Reset
          </Link>
        </div>
      </section>
    </main>
  );
}
