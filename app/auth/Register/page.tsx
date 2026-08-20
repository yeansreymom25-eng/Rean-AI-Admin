"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminLoginWithGoogle, adminRegister } from "../../_features/auth/adminAuth";
import { AuthShell, Field, GoogleButton, PrimaryButton } from "../AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await adminRegister(fullName, email, password);
      router.push("/admin_dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await adminLoginWithGoogle();
      router.push("/admin_dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in with Google");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Full name"
          name="full_name"
          placeholder="Charya Som"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          autoComplete="name"
        />
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
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />
        {errorMessage && (
          <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
        )}
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create account"}
        </PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#243856]" />
        <span className="text-xs font-bold uppercase text-slate-600">or</span>
        <span className="h-px flex-1 bg-[#243856]" />
      </div>

      <GoogleButton onClick={handleGoogleSignIn} disabled={isSubmitting}>
        Sign up with Google
      </GoogleButton>
    </AuthShell>
  );
}
