import Link from "next/link";
import { AuthShell, Field, GoogleButton, PrimaryButton } from "../AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to monitor students, curriculum, and AI quality from one secure workspace."
      footer={
        <>
          New to Rean AI?{" "}
          <Link href="/auth/Register" className="font-bold text-[#5368ff]">
            Create an account
          </Link>
        </>
      }
    >
      <form action="/admin_dashboard" method="get" className="space-y-5">
        <Field label="Email address" type="email" placeholder="admin@rean.ai" />
        <div>
          <Field label="Password" type="password" placeholder="Enter password" />
          <div className="mt-3 text-right">
            <Link
              href="/auth/Forgot_Pw"
              className="text-sm font-bold text-[#5368ff]"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <PrimaryButton type="submit">Sign in</PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#243856]" />
        <span className="text-xs font-bold uppercase text-slate-600">or</span>
        <span className="h-px flex-1 bg-[#243856]" />
      </div>

      <GoogleButton href="/admin_dashboard">Continue with Google</GoogleButton>
    </AuthShell>
  );
}
