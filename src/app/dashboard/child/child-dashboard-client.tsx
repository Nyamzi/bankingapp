"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type WalletSummary = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
};

type SavingsGoalSummary = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
};

type TransactionSummary = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
};

type ChoreSummary = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "assigned" | "completed";
  completedAt: string | null;
};

type AllowanceSummary = {
  id: string;
  title: string;
  amount: number;
  availableOn: string;
  notes: string | null;
  isActive: boolean;
};

type ChildDashboardClientProps = {
  fullName: string | null;
  nickname: string;
  email: string;
  wallet: WalletSummary;
  savingsGoals: SavingsGoalSummary[];
  transactions: TransactionSummary[];
  chores: ChoreSummary[];
  allowances: AllowanceSummary[];
};

type TabKey =
  | "home"
  | "wallet"
  | "transactions"
  | "savings"
  | "chores"
  | "allowances"
  | "actions"
  | "settings";

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "wallet", label: "My Wallet", icon: "💳" },
  { key: "transactions", label: "Transactions", icon: "🧾" },
  { key: "savings", label: "Savings Goals", icon: "🎯" },
  { key: "chores", label: "My Chores", icon: "✅" },
  { key: "allowances", label: "Allowances", icon: "💰" },
  { key: "actions", label: "Quick Actions", icon: "⚡" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

const formatMoney = (value: number) => `UGX ${value.toLocaleString()}`;

export function ChildDashboardClient({
  fullName,
  nickname,
  email,
  wallet,
  savingsGoals,
  transactions,
  chores,
  allowances,
}: ChildDashboardClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("home");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const displayName = fullName?.trim() || nickname;
  const approvedTransactions = useMemo(
    () => transactions.filter((tx) => tx.status === "approved").length,
    [transactions]
  );

  function clearMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function handleLogout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      amount: Number(formData.get("amount") ?? 0),
      type: String(formData.get("type") ?? "earn"),
      description: String(formData.get("description") ?? "").trim() || undefined,
    };

    const response = await fetch("/api/child/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setErrorMessage(data?.error ?? "Failed to submit transaction.");
      return;
    }

    setStatusMessage(data?.message ?? "Transaction submitted.");
    event.currentTarget.reset();
    startTransition(() => router.refresh());
  }

  async function handleCreateSavingsGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      targetAmount: Number(formData.get("targetAmount") ?? 0),
    };

    const response = await fetch("/api/child/savings-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setErrorMessage(data?.error ?? "Failed to create savings goal.");
      return;
    }

    setStatusMessage(data?.message ?? "Savings goal created.");
    event.currentTarget.reset();
    startTransition(() => router.refresh());
  }

  async function handleMarkChoreComplete(choreId: string) {
    clearMessages();

    const response = await fetch("/api/child/chores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choreId }),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setErrorMessage(data?.error ?? "Failed to confirm chore completion.");
      return;
    }

    setStatusMessage(data?.message ?? "Chore marked as completed.");
    startTransition(() => router.refresh());
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setErrorMessage(data?.error ?? "Failed to change password.");
      return;
    }

    setStatusMessage(data?.message ?? "Password changed.");
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col md:flex-row">
        <aside className="w-full border-r border-slate-200 bg-white md:w-72">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-6">
            <div className="rounded-xl bg-emerald-500 px-3 py-2 text-white">$</div>
            <div className="text-xl font-bold text-slate-800">Kids Banking</div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 py-4 md:block md:space-y-2 md:overflow-visible">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
                  tab === item.key
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-200 px-5 py-5 text-slate-700">
            <p className="text-xl font-semibold">{displayName}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-slate-700 hover:text-emerald-700"
            >
              <span>↩</span>
              Logout
            </button>
          </div>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <div className="mb-6">
            <h1 className="page-title">Welcome, {displayName}!</h1>
            <p className="page-subtitle">View chores and allowances set by your parent and keep progressing.</p>
          </div>

          {statusMessage ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-800">{statusMessage}</p> : null}
          {errorMessage ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">{errorMessage}</p> : null}

          {tab === "home" ? (
            <section className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-500">💵 Wallet Balance</h2>
                <p className="mt-2 text-3xl font-extrabold">{formatMoney(wallet.balance)}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-500">✅ Chores Completed</h2>
                <p className="mt-2 text-3xl font-extrabold">{chores.filter((chore) => chore.status === "completed").length}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-500">💰 Scheduled Allowances</h2>
                <p className="mt-2 text-3xl font-extrabold">{allowances.length}</p>
              </article>
            </section>
          ) : null}

          {tab === "wallet" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>💳</span><span>My Wallet</span></h2>
              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Current Balance</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(wallet.balance)}</p></article>
                <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Total Earned</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(wallet.totalEarned)}</p></article>
                <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Total Spent</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(wallet.totalSpent)}</p></article>
              </div>
            </section>
          ) : null}

          {tab === "transactions" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>🧾</span><span>Transactions</span></h2>
              <p className="mb-4 text-slate-600">Approved: {approvedTransactions} of {transactions.length}</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead><tr className="text-slate-500"><th className="py-2">Date</th><th className="py-2">Type</th><th className="py-2">Amount</th><th className="py-2">Status</th><th className="py-2">Description</th></tr></thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-slate-200">
                        <td className="py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 uppercase">{tx.type}</td>
                        <td className="py-2">{formatMoney(tx.amount)}</td>
                        <td className="py-2 uppercase">{tx.status}</td>
                        <td className="py-2">{tx.description ?? "-"}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 ? <tr><td className="py-3 text-slate-500" colSpan={5}>No transactions yet.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {tab === "savings" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>🎯</span><span>Savings Goals</span></h2>
              <div className="space-y-3">
                {savingsGoals.map((goal) => {
                  const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                  return (
                    <article key={goal.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-lg font-semibold text-slate-900">{goal.title}</p>
                      <p className="text-slate-600">{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)} ({progress}%)</p>
                      <progress className="mt-2 h-2 w-full" max={100} value={progress} />
                    </article>
                  );
                })}
                {savingsGoals.length === 0 ? <p className="text-slate-500">No savings goals yet. Create one in Quick Actions.</p> : null}
              </div>
            </section>
          ) : null}

          {tab === "chores" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>✅</span><span>My Chores</span></h2>
              <div className="mt-4 space-y-3">
                {chores.map((chore) => (
                  <article key={chore.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-lg font-semibold">{chore.title}</p>
                    <p className="text-slate-600">Due: {chore.dueDate ? new Date(chore.dueDate).toLocaleDateString() : "No due date"}</p>
                    <p className="text-slate-600">Status: {chore.status}</p>
                    {chore.description ? <p className="text-slate-600">{chore.description}</p> : null}
                    {chore.status === "assigned" ? (
                      <button type="button" className="btn-primary mt-3" onClick={() => handleMarkChoreComplete(chore.id)}>Mark as Complete</button>
                    ) : (
                      <p className="mt-3 text-emerald-700">Completed {chore.completedAt ? `on ${new Date(chore.completedAt).toLocaleDateString()}` : ""}</p>
                    )}
                  </article>
                ))}
                {chores.length === 0 ? <p className="text-slate-600">No chores assigned yet.</p> : null}
              </div>
            </section>
          ) : null}

          {tab === "allowances" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>💰</span><span>Allowance Schedule</span></h2>
              <div className="mt-4 space-y-3">
                {allowances.map((allowance) => (
                  <article key={allowance.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-lg font-semibold">{allowance.title} - {formatMoney(allowance.amount)}</p>
                    <p className="text-slate-600">Available on: {new Date(allowance.availableOn).toLocaleDateString()}</p>
                    <p className="text-slate-600">{allowance.notes ?? "No note"}</p>
                  </article>
                ))}
                {allowances.length === 0 ? <p className="text-slate-600">No scheduled allowances right now.</p> : null}
              </div>
            </section>
          ) : null}

          {tab === "actions" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>💸</span><span>Add Transaction</span></h2>
                <form onSubmit={handleCreateTransaction} className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="type">Type</label>
                  <select id="type" name="type" className="w-full rounded-xl border border-slate-200 px-3 py-2" defaultValue="earn"><option value="earn">Earn</option><option value="spend">Spend</option></select>
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="amount">Amount (UGX)</label>
                  <input id="amount" name="amount" type="number" min="1" required className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="description">Description (optional)</label>
                  <textarea id="description" name="description" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  <button type="submit" className="btn-primary w-full" disabled={isPending}>{isPending ? "Submitting..." : "Submit Transaction"}</button>
                </form>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>🐷</span><span>Create Savings Goal</span></h2>
                <form onSubmit={handleCreateSavingsGoal} className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="title">Goal Title</label>
                  <input id="title" name="title" type="text" required minLength={2} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="targetAmount">Target Amount (UGX)</label>
                  <input id="targetAmount" name="targetAmount" type="number" min="1" required className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  <button type="submit" className="btn-secondary w-full" disabled={isPending}>{isPending ? "Creating..." : "Create Goal"}</button>
                </form>
              </article>
            </section>
          ) : null}

          {tab === "settings" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>⚙️</span><span>Settings</span></h2>
              <p className="mb-5 text-slate-600">Account email: {email}</p>
              <form onSubmit={handleChangePassword} className="max-w-xl space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
                <input name="currentPassword" type="password" minLength={8} required placeholder="Current Password" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                <input name="newPassword" type="password" minLength={8} required placeholder="New Password" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                <input name="confirmPassword" type="password" minLength={8} required placeholder="Confirm New Password" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? "Updating..." : "Update Password"}</button>
              </form>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
