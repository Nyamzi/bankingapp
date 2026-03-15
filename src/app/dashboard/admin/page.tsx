import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const auth = getServerAuth();
  if (!auth) redirect("/login");
  if (auth.role !== "admin") redirect("/dashboard");

  const [adminUser, parentCount, childCount, lessons, quizzes, txCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, fullName: true },
    }),
    prisma.user.count({ where: { role: "parent" } }),
    prisma.user.count({ where: { role: "child" } }),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.transaction.count(),
  ]);

  const fallbackName = adminUser?.email?.split("@")[0] ?? "Admin";
  const adminName = adminUser?.fullName?.trim() || fallbackName;

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="page-title">Welcome, {adminName}!</h1>
          <p className="page-subtitle">🛠️ Admin Dashboard</p>
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          <article className="panel">
            <p className="text-sm text-slate-500">👨‍👩‍👧‍👦 Parents</p>
            <p className="text-2xl font-extrabold">{parentCount}</p>
          </article>
          <article className="panel">
            <p className="text-sm text-slate-500">🧒 Children</p>
            <p className="text-2xl font-extrabold">{childCount}</p>
          </article>
          <article className="panel">
            <p className="text-sm text-slate-500">📘 Lessons</p>
            <p className="text-2xl font-extrabold">{lessons}</p>
          </article>
          <article className="panel">
            <p className="text-sm text-slate-500">❓ Quizzes</p>
            <p className="text-2xl font-extrabold">{quizzes}</p>
          </article>
          <article className="panel">
            <p className="text-sm text-slate-500">🧾 Transactions</p>
            <p className="text-2xl font-extrabold">{txCount}</p>
          </article>
        </section>

        <section className="panel text-sm text-slate-700">
          <h2 className="section-title"><span>🔌</span><span>Admin API Endpoints</span></h2>
          <p className="rounded bg-amber-50 p-2 font-mono">GET/POST /api/admin/lessons</p>
          <p className="rounded bg-amber-50 p-2 font-mono">GET/POST /api/admin/quizzes</p>
          <p className="rounded bg-amber-50 p-2 font-mono">GET /api/admin/analytics</p>
        </section>
      </div>
    </main>
  );
}