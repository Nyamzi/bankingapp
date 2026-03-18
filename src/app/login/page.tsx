"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen bg-[#f5f6ff] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-sm rounded-[2.25rem] border border-[#1d1d1f]/10 bg-white p-5 shadow-[0_30px_60px_-35px_rgba(43,50,130,0.65)] md:max-w-md md:p-7">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4d43c8] text-lg font-bold tracking-wide text-white">
            KB
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2f2c86]">Kids Banking</h1>
          <p className="mt-1 text-sm text-[#7b7fa8]">Smart money habits start here</p>
        </div>

        <div className="mb-5">
          <h2 className="text-[1.7rem] font-bold leading-tight text-[#222659]">Welcome back!</h2>
          <p className="mt-1 text-sm text-[#7a7e9d]">Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#303566]">Email Address</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-[#dbdef2] bg-white px-11 py-3 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8f94bd]">
                @
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#303566]">Password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-[#dbdef2] bg-white px-11 py-3 pr-12 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8f94bd]">
                *
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6f73a0] transition hover:text-[#454a81]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                className="text-xs font-semibold text-[#5a4ae3] transition hover:text-[#4336b4]"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

          <button
            className="mt-1 w-full rounded-xl bg-[#5147d6] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#4339bb] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e2e5f8]" />
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#a1a6cb]">or</span>
          <span className="h-px flex-1 bg-[#e2e5f8]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9ddf4] bg-white px-3 py-2.5 text-sm font-semibold text-[#303566] transition hover:bg-[#f7f8ff]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.9 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.6S6.9 21.2 12 21.2c6.9 0 9.1-5 9.1-7.5 0-.5 0-.9-.1-1.3H12z"
              />
              <path
                fill="#34A853"
                d="M2.8 11.6c0 1.8.7 3.4 1.9 4.6l3.1-2.4c-.4-.6-.6-1.4-.6-2.2s.2-1.5.6-2.2L4.7 7c-1.2 1.2-1.9 2.8-1.9 4.6z"
              />
              <path
                fill="#FBBC05"
                d="M12 21.2c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.6-1.9 1-3.2 1-2.6 0-4.8-1.8-5.6-4.2l-3.1 2.4c1.5 3.1 4.6 5.5 8.7 5.5z"
              />
              <path
                fill="#4285F4"
                d="M18.2 18.9c1.8-1.7 2.9-4.1 2.9-7.3 0-.5 0-.9-.1-1.3H12v3.9h5.5c-.2 1.1-.8 2.4-2.1 3.4l2.8 2.3z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9ddf4] bg-white px-3 py-2.5 text-sm font-semibold text-[#303566] transition hover:bg-[#f7f8ff]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="#1877F2"
                d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 12v-8.5H7v-3.5h3.1V9.4c0-3.1 1.8-4.8 4.6-4.8 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5h-2.9v8.5C19.6 23.1 24 18.1 24 12.1z"
              />
            </svg>
            Facebook
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[#7d82a8]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#5147d6] hover:text-[#3d34b2]">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}