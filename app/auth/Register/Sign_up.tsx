import Image from "next/image";
import Link from "next/link";

export default function SignUp() {
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
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Join Rean AI and start managing your learning workspace.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#243856] bg-black p-1">
            <Link
              href="/Login"
              className="rounded-lg py-2.5 text-center text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Sign In
            </Link>
            <button className="rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] py-2.5 text-sm font-semibold text-white">
              Sign Up
            </button>
          </div>

          <form className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Full name
              </span>
              <input
                type="text"
                placeholder="Khemarak Pasey"
                className="h-12 w-full rounded-lg border border-[#35507a] bg-black px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </span>
              <input
                type="email"
                placeholder="pasey@example.com"
                className="h-12 w-full rounded-lg border border-[#35507a] bg-black px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </span>
              <input
                type="password"
                placeholder="Create password"
                className="h-12 w-full rounded-lg border border-[#35507a] bg-black px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
              />
            </label>

            <button className="h-12 w-full rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-semibold text-white shadow-lg shadow-blue-950/30">
              Create Account
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#243856]" />
            <span className="text-xs text-slate-500">or</span>
            <span className="h-px flex-1 bg-[#243856]" />
          </div>

          <button
            className="mx-auto flex h-10 w-10 items-center justify-center"
            aria-label="Continue with Google"
          >
            <Image
              src="/Ai tutor_google.png"
              alt="Google"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </button>
        </div>
      </section>
    </main>
  );
}
