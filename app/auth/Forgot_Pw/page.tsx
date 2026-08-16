import Link from "next/link";
import { AuthShell, Field, PrimaryButton } from "../AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your admin email and we will send a verification code."
      footer={
        <>
          Remember your password?{" "}
          <Link href="/auth/Login" className="font-bold text-[#5368ff]">
            Back to sign in
          </Link>
        </>
      }
    >
      <form action="/auth/Verify" method="get" className="space-y-5">
        <Field label="Email address" type="email" placeholder="admin@rean.ai" />
        <PrimaryButton type="submit">Send verification code</PrimaryButton>
      </form>
    </AuthShell>
  );
}
