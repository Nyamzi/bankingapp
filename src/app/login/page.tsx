"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      // Always go through /dashboard; server role checks route to parent/child/admin.
      window.location.assign("/dashboard");
    } catch {
      setLoading(false);
      setError("Unable to sign in right now. Please try again.");
    }
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-md panel">
        <h1 className="page-title">Login</h1>
        <p className="mb-5 text-sm text-slate-600">Access your dashboard account.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Password</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}