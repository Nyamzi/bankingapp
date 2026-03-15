import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParentDashboardClient } from "./parent-dashboard-client";

export default async function ParentDashboardPage() {
  const auth = getServerAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "parent") redirect("/dashboard");

  const [parentUser, children, pending, chores, allowances] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, fullName: true, nin: true, phoneNumber: true },
    }),
    prisma.childProfile.findMany({
      where: { parentId: auth.userId },
      include: {
        childUser: true,
        wallet: true,
        budgets: { where: { isActive: true }, take: 1, orderBy: { createdAt: "desc" } },
        savingsGoals: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { status: "pending", child: { parentId: auth.userId } },
      include: { child: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.choreAssignment.findMany({
      where: { parentId: auth.userId },
      include: { child: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.allowanceSchedule.findMany({
      where: { parentId: auth.userId },
      include: { child: true },
      orderBy: [{ availableOn: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <ParentDashboardClient
      parentProfile={{
        email: parentUser?.email ?? "parent@example.com",
        fullName: parentUser?.fullName ?? null,
        nin: parentUser?.nin ?? null,
        phoneNumber: parentUser?.phoneNumber ?? null,
      }}
      childProfiles={children.map((child) => ({
        id: child.id,
        fullName: child.childUser.fullName,
        nickname: child.nickname,
        age: child.age,
        email: child.childUser.email,
        wallet: child.wallet
          ? {
              balance: Number(child.wallet.balance),
              totalEarned: Number(child.wallet.totalEarned),
              totalSpent: Number(child.wallet.totalSpent),
            }
          : null,
        activeSpendingLimit: child.budgets[0] ? Number(child.budgets[0].monthlyLimit) : null,
        savingsGoals: child.savingsGoals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
          status: goal.status,
        })),
        recentTransactions: child.transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          status: tx.status,
          createdAt: tx.createdAt.toISOString(),
        })),
      }))}
      pending={pending.map((tx) => ({
        id: tx.id,
        childName: tx.child.nickname,
        amount: Number(tx.amount),
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
      }))}
      chores={chores.map((chore) => ({
        id: chore.id,
        title: chore.title,
        description: chore.description,
        dueDate: chore.dueDate?.toISOString() ?? null,
        status: chore.status,
        completedAt: chore.completedAt?.toISOString() ?? null,
        childId: chore.childId,
        childName: chore.child.nickname,
      }))}
      allowances={allowances.map((allowance) => ({
        id: allowance.id,
        title: allowance.title,
        amount: Number(allowance.amount),
        availableOn: allowance.availableOn.toISOString(),
        notes: allowance.notes,
        isActive: allowance.isActive,
        childId: allowance.childId,
        childName: allowance.child.nickname,
      }))}
    />
  );
}