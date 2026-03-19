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
  const completedChores = useMemo(
    () => chores.filter((chore) => chore.status === "completed").length,
    [chores]
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((tx) => tx.status === "pending").length,
    [transactions]
  );
  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);
  const upcomingChores = useMemo(
    () => chores.filter((chore) => chore.status === "assigned").slice(0, 4),
    [chores]
  );
  const nextAllowances = useMemo(() => allowances.slice(0, 4), [allowances]);

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

  function formatDate(value: string | null) {
    if (!value) return "No date";
    return new Date(value).toLocaleDateString();
  }

  function formatTime(value: string | null) {
    if (!value) return "Any time";
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <main className="min-h-screen bg-[#d5d8dd] p-2 md:p-4">
      <div className="mx-auto min-h-[calc(100vh-1rem)] max-w-[1500px] rounded-[2rem] border border-white/80 bg-[#f6f7f9] p-2 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.45)] md:p-3">
        <div className="grid min-h-[calc(100vh-2.5rem)] grid-cols-1 gap-3 xl:grid-cols-[250px_1fr_300px]">
          <aside className="rounded-[1.5rem] border border-[#eceef2] bg-white p-4">
            <div className="mb-5 flex items-center gap-2 border-b border-[#eceef2] pb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#f8d76d] to-[#c2a93b]" />
              <p className="text-lg font-extrabold text-[#212637]">Mindease</p>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-2 xl:block xl:space-y-1 xl:overflow-visible xl:pb-0">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`w-full whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    tab === item.key
                      ? "bg-[#eef0f3] text-[#161b28]"
                      : "text-[#666f81] hover:bg-[#f4f5f8]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-6 rounded-2xl bg-[#f4f6f9] p-4 text-center">
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-[#d2e7d6] to-[#98c7aa]" />
              <p className="text-lg font-bold text-[#222b3d]">Join Premium</p>
              <p className="text-sm text-[#798298]">$9.99/m</p>
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-[#151922] px-3 py-2 text-sm font-semibold text-white"
              >
                Explore plans
              </button>
            </div>

            <div className="mt-5 border-t border-[#eceef2] pt-4">
              <p className="text-sm font-bold text-[#202636]">{displayName}</p>
              <p className="truncate text-xs text-[#7a8298]">{email}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-full border border-[#d7dce6] px-3 py-2 text-sm font-semibold text-[#2d3447] hover:bg-[#f3f5f8]"
              >
                Logout
              </button>
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-[#eceef2] bg-white p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1f2434]">Welcome back, {displayName}!</h1>
                <p className="text-sm text-[#767f95]">Easily manage your chores, savings goals, and wallet requests.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-8 w-8 rounded-full border border-[#d8dde7] text-sm text-[#4f5768]">?</button>
                <button type="button" className="h-8 w-8 rounded-full border border-[#d8dde7] text-sm text-[#4f5768]">!</button>
              </div>
            </div>

            {statusMessage ? (
              <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {statusMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            {tab === "home" ? (
              <section className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <article className="rounded-2xl bg-[#f5d66d] p-4">
                    <p className="text-sm text-[#463f28]">Wallet balance</p>
                    <p className="mt-2 text-3xl font-semibold text-[#1c2130]">{formatMoney(wallet.balance)}</p>
                  </article>
                  <article className="rounded-2xl bg-[#d6e0ea] p-4">
                    <p className="text-sm text-[#435063]">Total earned</p>
                    <p className="mt-2 text-3xl font-semibold text-[#1c2130]">{formatMoney(wallet.totalEarned)}</p>
                  </article>
                  <article className="rounded-2xl bg-[#ddd5ea] p-4">
                    <p className="text-sm text-[#4d4462]">Pending</p>
                    <p className="mt-2 text-3xl font-semibold text-[#1c2130]">{pendingTransactions}</p>
                  </article>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl border border-[#eceef2] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#22293a]">Recent Messages</h2>
                    </div>
                    <div className="space-y-2">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-xl bg-[#f7f8fa] px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-[#22293a]">{tx.type.toUpperCase()}</p>
                            <p className="text-xs text-[#737c92]">{tx.description ?? "Money activity update"}</p>
                          </div>
                          <p className="text-xs text-[#7a8296]">{formatTime(tx.createdAt)}</p>
                        </div>
                      ))}
                      {recentTransactions.length === 0 ? (
                        <p className="text-sm text-[#7a8296]">No recent activity yet.</p>
                      ) : null}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-[#eceef2] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#22293a]">My stats</h2>
                    </div>
                    <p className="text-5xl font-semibold text-[#202636]">{completedChores}</p>
                    <p className="mt-1 text-sm text-[#6d768d]">completed chores</p>
                    <div className="my-3 h-px bg-[#e7ebf1]" />
                    <p className="text-sm text-[#5e677d]">{approvedTransactions} approved transactions this week</p>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7f8fa] px-3 py-2 text-sm">
                      <span className="text-[#5e677d]">Savings goals</span>
                      <span className="font-semibold text-[#1f2434]">{savingsGoals.length}</span>
                    </div>
                  </article>
                </div>

                <article className="rounded-2xl border border-[#eceef2] p-4">
                  <h2 className="mb-2 text-lg font-bold text-[#22293a]">Session Requests</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-[#7a8296]">
                          <th className="py-2 font-semibold">Task</th>
                          <th className="py-2 font-semibold">Requested Time</th>
                          <th className="py-2 font-semibold">Type</th>
                          <th className="py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chores.slice(0, 5).map((chore) => (
                          <tr key={chore.id} className="border-t border-[#edf0f5] text-[#242c3d]">
                            <td className="py-2 font-medium">{chore.title}</td>
                            <td className="py-2">{formatDate(chore.dueDate)}</td>
                            <td className="py-2">Chore</td>
                            <td className="py-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  chore.status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {chore.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {chores.length === 0 ? (
                          <tr>
                            <td className="py-3 text-[#7a8296]" colSpan={4}>
                              No chores assigned yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>
            ) : null}

            {tab === "wallet" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-4 text-xl font-bold text-[#1f2434]">My Wallet</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <article className="rounded-xl bg-[#f7f8fa] p-4">
                    <p className="text-sm text-[#6f7890]">Current Balance</p>
                    <p className="mt-1 text-2xl font-bold text-[#1f2434]">{formatMoney(wallet.balance)}</p>
                  </article>
                  <article className="rounded-xl bg-[#f7f8fa] p-4">
                    <p className="text-sm text-[#6f7890]">Total Earned</p>
                    <p className="mt-1 text-2xl font-bold text-[#1f2434]">{formatMoney(wallet.totalEarned)}</p>
                  </article>
                  <article className="rounded-xl bg-[#f7f8fa] p-4">
                    <p className="text-sm text-[#6f7890]">Total Spent</p>
                    <p className="mt-1 text-2xl font-bold text-[#1f2434]">{formatMoney(wallet.totalSpent)}</p>
                  </article>
                </div>
              </section>
            ) : null}

            {tab === "transactions" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-1 text-xl font-bold text-[#1f2434]">Transactions</h2>
                <p className="mb-4 text-sm text-[#6f7890]">
                  Approved: {approvedTransactions} of {transactions.length}
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-[#7a8296]">
                        <th className="py-2">Date</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-t border-[#edf0f5] text-[#242c3d]">
                          <td className="py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 uppercase">{tx.type}</td>
                          <td className="py-2">{formatMoney(tx.amount)}</td>
                          <td className="py-2 uppercase">{tx.status}</td>
                          <td className="py-2">{tx.description ?? "-"}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 ? (
                        <tr>
                          <td className="py-3 text-[#7a8296]" colSpan={5}>
                            No transactions yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {tab === "savings" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-4 text-xl font-bold text-[#1f2434]">Savings Goals</h2>
                <div className="space-y-3">
                  {savingsGoals.map((goal) => {
                    const progress =
                      goal.targetAmount > 0
                        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                        : 0;
                    return (
                      <article key={goal.id} className="rounded-xl border border-[#eceef2] p-4">
                        <p className="text-lg font-semibold text-[#1f2434]">{goal.title}</p>
                        <p className="text-sm text-[#6f7890]">
                          {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)} ({progress}%)
                        </p>
                        <progress className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#e8ebf1] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#5a62d8]" max={100} value={progress} />
                      </article>
                    );
                  })}
                  {savingsGoals.length === 0 ? (
                    <p className="text-sm text-[#7a8296]">No savings goals yet. Create one in Quick Actions.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {tab === "chores" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-4 text-xl font-bold text-[#1f2434]">My Chores</h2>
                <div className="space-y-3">
                  {chores.map((chore) => (
                    <article key={chore.id} className="rounded-xl border border-[#eceef2] p-4">
                      <p className="text-lg font-semibold text-[#1f2434]">{chore.title}</p>
                      <p className="text-sm text-[#6f7890]">Due: {formatDate(chore.dueDate)}</p>
                      <p className="text-sm text-[#6f7890]">Status: {chore.status}</p>
                      {chore.description ? <p className="mt-1 text-sm text-[#6f7890]">{chore.description}</p> : null}
                      {chore.status === "assigned" ? (
                        <button
                          type="button"
                          className="mt-3 rounded-full bg-[#1f2434] px-4 py-2 text-sm font-semibold text-white"
                          onClick={() => handleMarkChoreComplete(chore.id)}
                        >
                          Mark as Complete
                        </button>
                      ) : (
                        <p className="mt-3 text-sm font-semibold text-emerald-700">
                          Completed {chore.completedAt ? `on ${new Date(chore.completedAt).toLocaleDateString()}` : ""}
                        </p>
                      )}
                    </article>
                  ))}
                  {chores.length === 0 ? <p className="text-sm text-[#7a8296]">No chores assigned yet.</p> : null}
                </div>
              </section>
            ) : null}

            {tab === "allowances" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-4 text-xl font-bold text-[#1f2434]">Allowance Schedule</h2>
                <div className="space-y-3">
                  {allowances.map((allowance) => (
                    <article key={allowance.id} className="rounded-xl border border-[#eceef2] p-4">
                      <p className="text-lg font-semibold text-[#1f2434]">
                        {allowance.title} - {formatMoney(allowance.amount)}
                      </p>
                      <p className="text-sm text-[#6f7890]">
                        Available on: {new Date(allowance.availableOn).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#6f7890]">{allowance.notes ?? "No note"}</p>
                    </article>
                  ))}
                  {allowances.length === 0 ? (
                    <p className="text-sm text-[#7a8296]">No scheduled allowances right now.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {tab === "actions" ? (
              <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-[#eceef2] p-5">
                  <h2 className="mb-4 text-xl font-bold text-[#1f2434]">Add Transaction</h2>
                  <form onSubmit={handleCreateTransaction} className="space-y-3">
                    <label className="block text-sm font-semibold text-[#3a4152]" htmlFor="type">
                      Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                      defaultValue="earn"
                    >
                      <option value="earn">Earn</option>
                      <option value="spend">Spend</option>
                    </select>
                    <label className="block text-sm font-semibold text-[#3a4152]" htmlFor="amount">
                      Amount (UGX)
                    </label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="1"
                      required
                      className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                    />
                    <label className="block text-sm font-semibold text-[#3a4152]" htmlFor="description">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[#1f2434] px-4 py-2.5 text-sm font-semibold text-white"
                      disabled={isPending}
                    >
                      {isPending ? "Submitting..." : "Submit Transaction"}
                    </button>
                  </form>
                </article>

                <article className="rounded-2xl border border-[#eceef2] p-5">
                  <h2 className="mb-4 text-xl font-bold text-[#1f2434]">Create Savings Goal</h2>
                  <form onSubmit={handleCreateSavingsGoal} className="space-y-3">
                    <label className="block text-sm font-semibold text-[#3a4152]" htmlFor="title">
                      Goal Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      minLength={2}
                      className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                    />
                    <label className="block text-sm font-semibold text-[#3a4152]" htmlFor="targetAmount">
                      Target Amount (UGX)
                    </label>
                    <input
                      id="targetAmount"
                      name="targetAmount"
                      type="number"
                      min="1"
                      required
                      className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[#5a62d8] px-4 py-2.5 text-sm font-semibold text-white"
                      disabled={isPending}
                    >
                      {isPending ? "Creating..." : "Create Goal"}
                    </button>
                  </form>
                </article>
              </section>
            ) : null}

            {tab === "settings" ? (
              <section className="rounded-2xl border border-[#eceef2] p-5">
                <h2 className="mb-2 text-xl font-bold text-[#1f2434]">Settings</h2>
                <p className="mb-5 text-sm text-[#6f7890]">Account email: {email}</p>
                <form onSubmit={handleChangePassword} className="max-w-xl space-y-3">
                  <h3 className="text-lg font-semibold text-[#1f2434]">Change Password</h3>
                  <input
                    name="currentPassword"
                    type="password"
                    minLength={8}
                    required
                    placeholder="Current Password"
                    className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                  />
                  <input
                    name="newPassword"
                    type="password"
                    minLength={8}
                    required
                    placeholder="New Password"
                    className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                  />
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                    placeholder="Confirm New Password"
                    className="w-full rounded-xl border border-[#d9dfe9] px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#1f2434] px-4 py-2.5 text-sm font-semibold text-white"
                    disabled={isPending}
                  >
                    {isPending ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </section>
            ) : null}
          </section>

          <aside className="rounded-[1.5rem] border border-[#eceef2] bg-white p-4">
            <div className="mb-4 rounded-2xl bg-[#f7f8fa] p-4 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#d6dbe4] text-xl font-semibold text-[#2a3142]">
                {displayName
                  .split(" ")
                  .map((chunk) => chunk[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <p className="text-lg font-bold text-[#22293a]">{displayName}</p>
              <p className="text-sm text-[#7a8296]">Young Saver</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#dce1ea] bg-white px-3 py-1.5 text-sm text-[#2d3447]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </div>
            </div>

            <article className="rounded-2xl border border-[#eceef2] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#22293a]">My agenda</h2>
              </div>
              <div className="space-y-2.5">
                {upcomingChores.map((chore) => (
                  <div key={chore.id} className="rounded-xl bg-[#f7f8fa] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#22293a]">{chore.title}</p>
                    <p className="text-xs text-[#7a8296]">{formatDate(chore.dueDate)} {formatTime(chore.dueDate)}</p>
                  </div>
                ))}
                {upcomingChores.length === 0 ? (
                  <p className="text-sm text-[#7a8296]">No pending chores in your agenda.</p>
                ) : null}
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-full border border-[#d6dce7] px-3 py-2 text-sm font-semibold text-[#2e3547]"
              >
                All upcoming events
              </button>
            </article>

            <article className="mt-4 rounded-2xl border border-[#eceef2] p-4">
              <h3 className="mb-2 text-base font-bold text-[#22293a]">Next allowances</h3>
              <div className="space-y-2">
                {nextAllowances.map((allowance) => (
                  <div key={allowance.id} className="rounded-xl bg-[#f7f8fa] px-3 py-2">
                    <p className="text-sm font-semibold text-[#22293a]">{allowance.title}</p>
                    <p className="text-xs text-[#7a8296]">
                      {formatMoney(allowance.amount)} - {new Date(allowance.availableOn).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {nextAllowances.length === 0 ? (
                  <p className="text-sm text-[#7a8296]">No upcoming allowances right now.</p>
                ) : null}
              </div>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}
