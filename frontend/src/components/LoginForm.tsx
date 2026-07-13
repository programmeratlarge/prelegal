"use client";

import { useEffect, useState } from "react";
import { AuthError, me, signin, signup } from "@/lib/authClient";
import BrandMark from "./BrandMark";
import Button from "./ui/Button";
import { Field, inputClass } from "./ui/Field";
import LoadingState from "./ui/LoadingState";

type Mode = "signin" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    me()
      .then(() => {
        if (!cancelled) window.location.href = "/";
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (mode === "signup" && password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    if (mode === "signup" && confirm !== password) {
      errors.confirm = "Passwords don't match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(email, password);
      } else {
        await signin(email, password);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setFieldErrors({});
    setConfirm("");
  }

  if (checkingSession) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <BrandMark large />
        <div>
          <h1 className="text-xl font-bold text-brand-navy">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            {mode === "signin"
              ? "Sign in to pick up your drafts where you left off."
              : "Draft NDAs, service agreements, and more — with an AI assistant."}
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <input
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </Field>
        {mode === "signup" && (
          <Field label="Confirm password" error={fieldErrors.confirm}>
            <input
              type="password"
              required
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Same password again"
              autoComplete="new-password"
            />
          </Field>
        )}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        onClick={switchMode}
        className="mt-4 text-center text-sm font-medium text-brand-blue hover:underline"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
