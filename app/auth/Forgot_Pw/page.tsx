"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { requestAdminPasswordReset } from "../../_features/auth/adminAuth";
import { AuthShell, Field, PrimaryButton } from "../AuthShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data = await requestAdminPasswordReset(email);
      if (data.reset_token) {
        window.sessionStorage.setItem("rean_admin_reset_token", data.reset_token);
      }
      router.push("/auth/Verify");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to request reset");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Email address"
          name="email"
          type="email"
          placeholder="admin@rean.ai"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
        {errorMessage && (
          <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
        )}
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send verification code"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
