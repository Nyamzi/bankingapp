import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChildDashboardClient } from "./child-dashboard-client";

export default async function ChildDashboardPage() {
  const auth = getServerAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "child") redirect("/dashboard");

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, fullName: true },
    }),
    prisma.childProfile.findUnique({
      where: { childUserId: auth.userId },
      include: {
        wallet: true,
        savingsGoals: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
        chores: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
        allowanceSchedules: {
          where: { isActive: true },
          orderBy: [{ availableOn: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
  ]);

  if (!profile?.wallet) {
    return <main className="p-6">No child wallet found.</main>;
  }

  return (
    <ChildDashboardClient
      fullName={user?.fullName ?? null}
      nickname={profile.nickname}
      email={user?.email ?? "child@example.com"}
      wallet={{
        balance: Number(profile.wallet.balance),
        totalEarned: Number(profile.wallet.totalEarned),
        totalSpent: Number(profile.wallet.totalSpent),
      }}
      savingsGoals={profile.savingsGoals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        status: goal.status,
      }))}
      transactions={profile.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
      }))}
      chores={profile.chores.map((chore) => ({
        id: chore.id,
        title: chore.title,
        description: chore.description,
        dueDate: chore.dueDate?.toISOString() ?? null,
        status: chore.status,
        completedAt: chore.completedAt?.toISOString() ?? null,
      }))}
      allowances={profile.allowanceSchedules.map((allowance) => ({
        id: allowance.id,
        title: allowance.title,
        amount: Number(allowance.amount),
        availableOn: allowance.availableOn.toISOString(),
        notes: allowance.notes,
        isActive: allowance.isActive,
      }))}
    />
  );
}