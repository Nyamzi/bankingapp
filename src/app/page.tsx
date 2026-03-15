import Link from "next/link";

export default function Home() {
  return (
    <main className="app-shell">
      <div className="page-wrap">
        <header className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 13v-2l2-1 2-4h6l3 2h2v3l-2 2v3h-3l-1-2H9l-1 2H5v-3z" />
            </svg>
          </div>

          <h1 className="page-title">KidBank</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
            Teaching kids aged 6-17 about money through fun, interactive banking simulation
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex min-w-44 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-3 text-base font-semibold text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex min-w-44 items-center justify-center rounded-xl border-2 border-blue-500 bg-white px-5 py-3 text-base font-semibold text-blue-600"
            >
            Signup
            </Link>
          </div>

          <p className="mt-3 text-lg text-slate-500">
            Only parents can create new accounts. Children should ask their parent to set up an account for them.
          </p>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border-2 border-violet-200 bg-white/70 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 13v-2l2-1 2-4h6l3 2h2v3l-2 2v3h-3l-1-2H9l-1 2H5v-3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Save &amp; Learn</h2>
            <p className="mt-3 text-base text-slate-600">
              Set savings goals and watch your money grow with interactive visualizations
            </p>
          </article>

          <article className="rounded-3xl border-2 border-blue-200 bg-white/70 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16l5-5 4 4 7-7" />
                <path d="M15 8h5v5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Track Spending</h2>
            <p className="mt-3 text-base text-slate-600">
              Monitor transactions and learn smart spending habits with real-time updates
            </p>
          </article>

          <article className="rounded-3xl border-2 border-pink-200 bg-white/70 p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l6 3v5c0 5-3.5 8-6 9-2.5-1-6-4-6-9V6l6-3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Earn Rewards</h2>
            <p className="mt-3 text-base text-slate-600">
              Complete tasks and challenges to earn allowances and bonuses
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-300 bg-white/60 p-7">
          <div className="grid gap-6 md:grid-cols-3">
            <article className="text-center">
              <p className="text-2xl">👶 → 🎓</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">For Ages 6-17</h3>
              <p className="mt-2 text-base text-slate-600">
                Age-appropriate lessons that grow with your child
              </p>
            </article>

            <article className="text-center">
              <p className="text-2xl">👨‍👩‍👧‍👦</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">Parent Controls</h3>
              <p className="mt-2 text-base text-slate-600">
                Monitor activity, set limits, and manage allowances
              </p>
            </article>

            <article className="text-center">
              <p className="text-2xl">🔒</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">Safe &amp; Secure</h3>
              <p className="mt-2 text-base text-slate-600">
                Simulation environment with no real money involved
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
