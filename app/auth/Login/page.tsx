"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminLogin } from "../../_features/auth/adminAuth";
import { AuthShell, Field, PrimaryButton } from "../AuthShell";

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

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to monitor students, curriculum, and AI quality from one secure workspace."
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

        {errorMessage && (
          <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
        )}

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
