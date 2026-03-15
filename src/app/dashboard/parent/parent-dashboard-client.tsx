"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ChildSummary = {
  id: string;
  fullName: string | null;
  nickname: string;
  age: number;
  email: string;
  wallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  } | null;
  activeSpendingLimit: number | null;
  savingsGoals: Array<{
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    status: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

type PendingSummary = {
  id: string;
  childName: string;
  amount: number;
  type: string;
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
  childId: string;
  childName: string;
};

type AllowanceSummary = {
  id: string;
  title: string;
  amount: number;
  availableOn: string;
  notes: string | null;
  isActive: boolean;
  childId: string;
  childName: string;
};

type ParentProfile = {
  email: string;
  fullName: string | null;
  nin: string | null;
  phoneNumber: string | null;
};

type ParentDashboardClientProps = {
  parentProfile: ParentProfile;
  childProfiles: ChildSummary[];
  pending: PendingSummary[];
  chores: ChoreSummary[];
  allowances: AllowanceSummary[];
};

type TabKey =
  | "home"
  | "children"
  | "allowances"
  | "chores"
  | "limits"
  | "progress"
  | "savings"
  | "settings";

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "children", label: "My Children", icon: "👨‍👩‍👧‍👦" },
  { key: "allowances", label: "Allowances", icon: "💰" },
  { key: "chores", label: "Chores", icon: "✅" },
  { key: "limits", label: "Spending Limits", icon: "📉" },
  { key: "progress", label: "Child Progress", icon: "📈" },
  { key: "savings", label: "Manage Savings", icon: "🐷" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

const formatMoney = (value: number) => `USh ${value.toLocaleString()}`;

export function ParentDashboardClient({
  parentProfile,
  childProfiles,
  pending,
  chores,
  allowances,
}: ParentDashboardClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("home");
  const [showAddChild, setShowAddChild] = useState(false);
  const [childIdForLimit, setChildIdForLimit] = useState(childProfiles[0]?.id ?? "");
  const [childIdForChore, setChildIdForChore] = useState(childProfiles[0]?.id ?? "");
  const [childIdForAllowance, setChildIdForAllowance] = useState(childProfiles[0]?.id ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const parentName = parentProfile.fullName?.trim() || parentProfile.email.split("@")[0] || "Parent";

  const totalSaved = useMemo(
    () => childProfiles.reduce((sum, child) => sum + (child.wallet?.balance ?? 0), 0),
    [childProfiles]
  );

  const completedChores = chores.filter((chore) => chore.status === "completed").length;

  async function handleLogout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  function clearMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function postJson(url: string, payload: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      throw new Error(data?.error ?? "Request failed.");
    }
    return data;
  }

  async function handleAddChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
      age: Number(formData.get("age") ?? 0),
    };

    try {
      await postJson("/api/parent/children", payload);
      setStatusMessage("Child account created successfully.");
      setShowAddChild(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to add child.");
    }
  }

  async function handleSetSpendingLimit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      childId: String(formData.get("childId") ?? ""),
      monthlyLimit: Number(formData.get("monthlyLimit") ?? 0),
    };

    try {
      await postJson("/api/parent/spending-limit", payload);
      setStatusMessage("Spending limit updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to set spending limit.");
    }
  }

  async function handleAssignChore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      childId: String(formData.get("childId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "").trim() || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    };

    try {
      await postJson("/api/parent/chores", payload);
      setStatusMessage("Chore assigned successfully.");
      event.currentTarget.reset();
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to assign chore.");
    }
  }

  async function handleScheduleAllowance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      childId: String(formData.get("childId") ?? ""),
      title: String(formData.get("title") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      availableOn: String(formData.get("availableOn") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    };

    try {
      await postJson("/api/parent/allowances", payload);
      setStatusMessage("Allowance scheduled successfully.");
      event.currentTarget.reset();
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to schedule allowance.");
    }
  }

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    clearMessages();

    try {
      await postJson(`/api/parent/transactions/${id}/decision`, { decision });
      setStatusMessage(`Transaction ${decision}.`);
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update transaction.");
    }
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      nin: String(formData.get("nin") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
      email: String(formData.get("email") ?? ""),
    };

    const response = await fetch("/api/parent/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setErrorMessage(data?.error ?? "Failed to update profile.");
      return;
    }

    setStatusMessage(data?.message ?? "Account details updated.");
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

    try {
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

      setStatusMessage(data?.message ?? "Password changed successfully.");
      event.currentTarget.reset();
    } catch {
      setErrorMessage("Unable to change password right now.");
    }
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
                onClick={() => {
                  setTab(item.key);
                  if (item.key !== "home") setShowAddChild(false);
                }}
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
            <p className="text-xl font-semibold">{parentName}</p>
            <p className="text-sm text-slate-500">{parentProfile.email}</p>
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
          {statusMessage ? (
            <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-800">{statusMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-800">{errorMessage}</p>
          ) : null}

          {tab === "home" ? (
            <>
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="page-title">Welcome, {parentName}!</h1>
                  <p className="page-subtitle">Manage chores, allowances, and your children&apos;s progress.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddChild((value) => !value)}
                  className="btn-primary rounded-xl px-6 py-3 text-base"
                >
                  + Add Child
                </button>
              </div>

              {showAddChild ? (
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-bold">Create Child Account</h2>
                  <form onSubmit={handleAddChild} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input name="fullName" required placeholder="Child full name" className="rounded-xl border border-slate-300 px-3 py-2" />
                    <input name="nickname" required placeholder="Nickname" className="rounded-xl border border-slate-300 px-3 py-2" />
                    <input name="age" type="number" min={5} max={17} required placeholder="Age" className="rounded-xl border border-slate-300 px-3 py-2" />
                    <input name="email" type="email" required placeholder="Child email" className="rounded-xl border border-slate-300 px-3 py-2" />
                    <input name="password" type="password" minLength={8} required placeholder="Temporary password" className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" />
                    <div className="md:col-span-2">
                      <button disabled={isPending} className="btn-primary" type="submit">
                        {isPending ? "Saving..." : "Save Child"}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              <div className="mb-5 grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Children Managed</p>
                  <p className="text-3xl font-bold text-slate-900">{childProfiles.length}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Completed Chores</p>
                  <p className="text-3xl font-bold text-slate-900">{completedChores}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Family Total Saved</p>
                  <p className="text-3xl font-bold text-slate-900">{formatMoney(totalSaved)}</p>
                </article>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {childProfiles.map((child) => (
                  <article key={child.id} className="rounded-3xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-bold text-slate-900">{child.nickname}</h3>
                    <p className="text-sm text-slate-500">{child.fullName ?? child.email}</p>
                    <div className="mt-4 space-y-2 text-base text-slate-600">
                      <p className="flex items-center justify-between"><span>💵 Total Saved</span><span className="text-emerald-600">{formatMoney(child.wallet?.balance ?? 0)}</span></p>
                      <p className="flex items-center justify-between"><span>📉 Spending Limit</span><span>{child.activeSpendingLimit ? formatMoney(child.activeSpendingLimit) : "Not set"}</span></p>
                    </div>
                  </article>
                ))}
                {childProfiles.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No children added yet. Click Add Child to create an account.</p>
                ) : null}
              </div>
            </>
          ) : null}

          {tab === "children" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>👨‍👩‍👧‍👦</span><span>My Children</span></h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-base">
                  <thead className="text-slate-500">
                    <tr><th className="py-2">Name</th><th className="py-2">Nickname</th><th className="py-2">Age</th><th className="py-2">Email</th><th className="py-2">Saved</th></tr>
                  </thead>
                  <tbody>
                    {childProfiles.map((child) => (
                      <tr key={child.id} className="border-t border-slate-100">
                        <td className="py-3 font-semibold">{child.fullName ?? "-"}</td>
                        <td className="py-3">{child.nickname}</td>
                        <td className="py-3">{child.age}</td>
                        <td className="py-3">{child.email}</td>
                        <td className="py-3">{formatMoney(child.wallet?.balance ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {tab === "allowances" ? (
            <section className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>💰</span><span>Schedule Allowance</span></h2>
                <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleScheduleAllowance}>
                  <select aria-label="Select child for allowance" name="childId" value={childIdForAllowance} onChange={(event) => setChildIdForAllowance(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" required>
                    {childProfiles.map((child) => <option key={child.id} value={child.id}>{child.nickname}</option>)}
                  </select>
                  <input name="title" required placeholder="Allowance title" className="rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="amount" type="number" min={1} step="1" required placeholder="Amount (USh)" className="rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="availableOn" type="date" required className="rounded-xl border border-slate-300 px-3 py-2" />
                  <textarea name="notes" placeholder="Notes (optional)" className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" rows={2} />
                  <div className="md:col-span-2"><button className="btn-primary" type="submit" disabled={isPending || childProfiles.length === 0}>{isPending ? "Saving..." : "Save Allowance"}</button></div>
                </form>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">Scheduled Allowances</h3>
                <div className="mt-3 space-y-3">
                  {allowances.map((allowance) => (
                    <div key={allowance.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-lg font-semibold">{allowance.title} - {formatMoney(allowance.amount)}</p>
                      <p className="text-slate-600">For: {allowance.childName}</p>
                      <p className="text-slate-600">Available on: {new Date(allowance.availableOn).toLocaleDateString()}</p>
                      <p className="text-slate-600">{allowance.notes ?? "No notes"}</p>
                    </div>
                  ))}
                  {allowances.length === 0 ? <p className="text-slate-600">No scheduled allowances yet.</p> : null}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">Pending Transaction Approvals</h3>
                <div className="mt-3 space-y-3">
                  {pending.map((tx) => (
                    <article key={tx.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-lg font-semibold">{tx.childName} requested {tx.type.toUpperCase()}</p>
                      <p className="text-slate-600">{formatMoney(tx.amount)} | {tx.description ?? "No note"}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="btn-primary" onClick={() => handleDecision(tx.id, "approved")}>Approve</button>
                        <button type="button" className="btn-danger" onClick={() => handleDecision(tx.id, "rejected")}>Reject</button>
                      </div>
                    </article>
                  ))}
                  {pending.length === 0 ? <p className="text-slate-600">No pending requests right now.</p> : null}
                </div>
              </article>
            </section>
          ) : null}

          {tab === "chores" ? (
            <section className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>✅</span><span>Assign Chore</span></h2>
                <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleAssignChore}>
                  <select aria-label="Select child for chore" name="childId" value={childIdForChore} onChange={(event) => setChildIdForChore(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" required>
                    {childProfiles.map((child) => <option key={child.id} value={child.id}>{child.nickname}</option>)}
                  </select>
                  <input name="title" required placeholder="Chore title" className="rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="dueDate" type="date" className="rounded-xl border border-slate-300 px-3 py-2" />
                  <textarea name="description" placeholder="Description (optional)" className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" rows={2} />
                  <div className="md:col-span-2"><button className="btn-primary" type="submit" disabled={isPending || childProfiles.length === 0}>{isPending ? "Saving..." : "Assign Chore"}</button></div>
                </form>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">Assigned Chores</h3>
                <div className="mt-3 space-y-3">
                  {chores.map((chore) => (
                    <div key={chore.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-lg font-semibold">{chore.title}</p>
                      <p className="text-slate-600">Child: {chore.childName}</p>
                      <p className="text-slate-600">Due: {chore.dueDate ? new Date(chore.dueDate).toLocaleDateString() : "No due date"}</p>
                      <p className="text-slate-600">Status: {chore.status}</p>
                      {chore.description ? <p className="text-slate-600">{chore.description}</p> : null}
                    </div>
                  ))}
                  {chores.length === 0 ? <p className="text-slate-600">No chores assigned yet.</p> : null}
                </div>
              </article>
            </section>
          ) : null}

          {tab === "limits" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>📉</span><span>Spending Limits</span></h2>
              <form className="mt-4 flex flex-col gap-3 md:max-w-xl" onSubmit={handleSetSpendingLimit}>
                <select aria-label="Select child for spending limit" name="childId" value={childIdForLimit} onChange={(event) => setChildIdForLimit(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" required>
                  {childProfiles.map((child) => <option key={child.id} value={child.id}>{child.nickname}</option>)}
                </select>
                <input name="monthlyLimit" type="number" min={1} step="1" placeholder="Monthly limit in USh" className="rounded-xl border border-slate-300 px-3 py-2" required />
                <button disabled={isPending || childProfiles.length === 0} className="btn-primary w-fit" type="submit">{isPending ? "Saving..." : "Update Limit"}</button>
              </form>
            </section>
          ) : null}

          {tab === "progress" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>📈</span><span>Child Progress</span></h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {childProfiles.map((child) => {
                  const approved = child.recentTransactions.filter((tx) => tx.status === "approved").length;
                  const total = child.recentTransactions.length;
                  return (
                    <article key={child.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-lg font-semibold">{child.nickname}</p>
                      <p className="text-slate-600">Approved activities: {approved}/{total}</p>
                      <p className="text-slate-600">Current saved: {formatMoney(child.wallet?.balance ?? 0)}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {tab === "savings" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="section-title"><span>🐷</span><span>Manage Savings</span></h2>
              <div className="mt-4 space-y-4">
                {childProfiles.map((child) => (
                  <article key={child.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-lg font-semibold">{child.nickname}</p>
                    <div className="mt-2 space-y-2">
                      {child.savingsGoals.map((goal) => {
                        const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                        return (
                          <div key={goal.id} className="rounded-lg bg-slate-50 p-3">
                            <p className="font-semibold">{goal.title}</p>
                            <p className="text-slate-600">{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)} ({progress}%)</p>
                          </div>
                        );
                      })}
                      {child.savingsGoals.length === 0 ? <p className="text-slate-600">No savings goals yet.</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "settings" ? (
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>🧾</span><span>Account Details</span></h2>
                <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3">
                  <input name="fullName" defaultValue={parentProfile.fullName ?? ""} placeholder="Full name" required className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="email" type="email" defaultValue={parentProfile.email} placeholder="Email" required className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="nin" defaultValue={parentProfile.nin ?? ""} placeholder="NIN" required className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="phoneNumber" defaultValue={parentProfile.phoneNumber ?? ""} placeholder="Phone number" required className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <button className="btn-primary" type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Profile"}</button>
                </form>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="section-title"><span>🔐</span><span>Security</span></h2>
                <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                  <input name="currentPassword" type="password" minLength={8} required placeholder="Current password" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="newPassword" type="password" minLength={8} required placeholder="New password" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <input name="confirmPassword" type="password" minLength={8} required placeholder="Confirm new password" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  <button className="btn-primary" type="submit">Update Password</button>
                </form>
                <div className="mt-5 text-sm text-slate-600">
                  <p>Children managed: {childProfiles.length}</p>
                  <p>Total family saved: {formatMoney(totalSaved)}</p>
                </div>
              </article>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
