"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [nin, setNin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function getPasswordStrength(value: string): { label: string; level: "weak" | "medium" | "strong" } {
    if (!value) return { label: "Weak", level: "weak" };

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 2) return { label: "Weak", level: "weak" };
    if (score <= 4) return { label: "Medium", level: "medium" };
    return { label: "Strong", level: "strong" };
  }

  const passwordStrength = getPasswordStrength(password);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!agreed) {
      setLoading(false);
      setError("Please agree to the terms to continue");
      return;
    }

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
    <main className="min-h-screen bg-[#f5f6ff] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-sm rounded-[2.25rem] border border-[#1d1d1f]/10 bg-white p-5 shadow-[0_30px_60px_-35px_rgba(43,50,130,0.65)] md:max-w-md md:p-7">
        <div className="mb-4">
          <h1 className="text-[1.75rem] font-extrabold leading-tight text-[#2f2c86]">Create Account</h1>
          <p className="mt-1 text-sm text-[#7b7fa8]">Fill in your details to get started</p>
        </div>

        <div className="mb-5">
          <div className="h-1.5 w-full rounded-full bg-[#ebeefe]">
            <div className="h-full w-1/3 rounded-full bg-[#4f45d1]" />
          </div>
          <p className="mt-1 text-right text-[11px] font-semibold text-[#9095be]">
            Step 1 of 1 - Personal Details
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">Full Name</label>
            <input
              className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">National ID Number (NIN)</label>
            <input
              className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 uppercase text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
              type="text"
              value={nin}
              onChange={(event) => setNin(event.target.value.toUpperCase())}
              placeholder="e.g. CM90003456789"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex w-24 items-center justify-center rounded-xl border border-[#dbdef2] bg-[#f8f9ff] px-2 text-sm font-semibold text-[#303566]">
                +256
              </div>
              <input
                className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="07X XXX XXXX"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">Email Address</label>
            <input
              className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">Password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 pr-12 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
                type={showPassword ? "text" : "password"}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6f73a0] transition hover:text-[#454a81]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-[#ebeefe]">
              <div
                className={`h-full rounded-full transition-all ${
                  passwordStrength.level === "strong"
                    ? "w-full bg-green-600"
                    : passwordStrength.level === "medium"
                      ? "w-2/3 bg-teal-700"
                      : "w-1/3 bg-amber-500"
                }`}
              />
            </div>
            <p className="mt-1 text-xs font-medium text-[#7f84ad]">Password strength: {passwordStrength.label}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#303566]">Confirm Password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-[#dbdef2] bg-white px-3 py-2.5 pr-12 text-[#222659] outline-none transition focus:border-[#5a4ae3] focus:ring-4 focus:ring-[#5a4ae3]/15"
                type={showConfirmPassword ? "text" : "password"}
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6f73a0] transition hover:text-[#454a81]"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs text-[#666d9a]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#c9ceef] text-[#5147d6] focus:ring-[#5147d6]"
            />
            <span>
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

          <button
            className="mt-1 w-full rounded-xl bg-[#5147d6] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#4339bb] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#7d82a8]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#5147d6] hover:text-[#3d34b2]">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}