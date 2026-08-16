import Link from "next/link";
import { AuthShell, Field, GoogleButton, PrimaryButton } from "../AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create admin access"
      subtitle="Set up a secure account for the Rean AI admin dashboard."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/Login" className="font-bold text-[#5368ff]">
            Sign in
          </Link>
        </>
      }
    >
      <form action="/admin_dashboard" method="get" className="space-y-5">
        <Field label="Full name" placeholder="Charya Som" />
        <Field label="Email address" type="email" placeholder="admin@rean.ai" />
        <Field label="Password" type="password" placeholder="Create password" />
        <PrimaryButton type="submit">Create account</PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#243856]" />
        <span className="text-xs font-bold uppercase text-slate-600">or</span>
        <span className="h-px flex-1 bg-[#243856]" />
      </div>

      <GoogleButton href="/admin_dashboard">Sign up with Google</GoogleButton>
    </AuthShell>
  );
}
