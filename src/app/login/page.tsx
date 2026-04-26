"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Login failed. Please check your credentials.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Could not sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-white">
      <h1 className="text-4xl font-black tracking-tight">Sign In</h1>
      <p className="mt-3 text-zinc-400">
        Sign in with your WooCommerce/WordPress customer account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Email or Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
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
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
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
          className="mt-6 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-400">
          New here?{" "}
          <Link href="/signup" className="text-orange-400 hover:text-orange-300">
            Create an account
          </Link>
        </p>
      </form>

      <Link
        href="/"
        className="mt-4 inline-block rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
      >
        Back to Home
      </Link>
    </div>
  );
}
