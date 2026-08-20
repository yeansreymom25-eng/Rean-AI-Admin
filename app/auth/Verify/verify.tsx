"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { confirmAdminPasswordReset } from "../../_features/auth/adminAuth";
import { AuthShell, Field, PrimaryButton } from "../AuthShell";

export default function VerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem("rean_admin_reset_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await confirmAdminPasswordReset(token, password);
      window.sessionStorage.removeItem("rean_admin_reset_token");
      router.push("/auth/Login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Verification token"
          name="token"
          placeholder="Paste reset token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
          autoComplete="one-time-code"
        />
        <Field
          label="New password"
          name="password"
          type="password"
          placeholder="Create new password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />

        {errorMessage && (
          <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
        )}

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </PrimaryButton>
      </form>

      <div className="mt-5 text-center">
        <Link href="/auth/Login" className="text-sm font-bold text-slate-500">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
