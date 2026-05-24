"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedNext = searchParams.get("next") ?? "";
  const nextPath = requestedNext.startsWith("/") ? requestedNext : "/account";
  const nextSuffix = nextPath === "/account" ? "" : `?next=${encodeURIComponent(nextPath)}`;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Could not create your account right now.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Could not sign up right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-white">
      <h1 className="text-4xl font-black tracking-tight">Create Account</h1>
      <p className="mt-3 text-zinc-400">
        Sign up to create your account, track orders, and check out faster.
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
              First Name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[var(--brand-primary)] focus:outline-none"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[var(--brand-primary)] focus:outline-none"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <label className="mb-1.5 mt-4 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[var(--brand-primary)] focus:outline-none"
          placeholder="you@example.com"
          required
        />

        <label className="mb-1.5 mt-4 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[var(--brand-primary)] focus:outline-none"
          required
        />

        <label className="mb-1.5 mt-4 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[var(--brand-primary)] focus:outline-none"
          required
        />

        {error && (
          <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-primary)]/20 transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-400">
        Already have an account?{" "}
          <Link href={`/login${nextSuffix}`} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}