"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminLogin, adminLoginWithGoogle } from "../../_features/auth/adminAuth";
import { AuthShell, Field, GoogleButton, PrimaryButton } from "../AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await adminLogin(email, password);
      router.push("/admin_dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
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
        <div>
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="mt-3 text-right">
            <Link
              href="/auth/Forgot_Pw"
              className="text-sm font-bold text-[#5368ff]"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
        )}

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#243856]" />
        <span className="text-xs font-bold uppercase text-slate-600">or</span>
        <span className="h-px flex-1 bg-[#243856]" />
      </div>

      <GoogleButton onClick={handleGoogleSignIn} disabled={isSubmitting}>
        Continue with Google
      </GoogleButton>
    </AuthShell>
  );
}
