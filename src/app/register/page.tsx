"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [nin, setNin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        nin,
        phoneNumber,
        email,
        password,
        confirmPassword,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-md panel">
        <h1 className="page-title">Parent Registration</h1>
        <p className="mb-5 text-sm text-slate-600">
          Create a parent account to onboard and manage child wallets.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Full Name</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">NIN</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2 uppercase"
              type="text"
              value={nin}
              onChange={(event) => setNin(event.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Phone Number</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="e.g. +256700000000"
              required
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Confirm Password</label>
            <input
              className="w-full rounded-xl border border-amber-200 px-3 py-2"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Parent Account"}
          </button>
        </form>
      </div>
    </main>
  );
}