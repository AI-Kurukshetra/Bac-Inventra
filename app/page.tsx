import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="container">
        <header className="flex items-center justify-between gap-4">
          <div className="brand">Bac Inventra</div>
          <div className="flex items-center gap-3">
            <Link className="button secondary" href="/login">Sign In</Link>
            <Link className="button" href="/login">Get Started</Link>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="panel relative overflow-hidden">
            <div className="absolute -top-16 -right-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,#0f766e33,transparent_70%)]" />
            <div className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,#f59e0b33,transparent_70%)]" />
            <div className="relative">
              <div className="badge">Inventory OS</div>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                Clean inventory. Clear decisions. Faster ops.
              </h1>
              <p className="muted mt-4 text-base md:text-lg">
                Bac Inventra brings products, stock, suppliers, customers, and orders into a single,
                easy-to-run system built for growing teams.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="button" href="/login">Start Free</Link>
                <Link className="button secondary" href="/login">View Demo</Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
                <div className="badge">Low-stock alerts</div>
                <div className="badge">Multi-location ready</div>
                <div className="badge">Purchase & sales orders</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="panel">
              <div className="text-sm font-semibold">Live snapshot</div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="muted text-xs uppercase tracking-wide">On hand</div>
                  <div className="kpi">4,280</div>
                </div>
                <div className="card">
                  <div className="muted text-xs uppercase tracking-wide">Low stock</div>
                  <div className="kpi">12</div>
                </div>
                <div className="card">
                  <div className="muted text-xs uppercase tracking-wide">Suppliers</div>
                  <div className="kpi">28</div>
                </div>
                <div className="card">
                  <div className="muted text-xs uppercase tracking-wide">Orders</div>
                  <div className="kpi">36</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="text-sm font-semibold">What you can do</div>
              <div className="mt-4 grid gap-3">
                <div className="card">
                  <div className="text-sm font-semibold">Products & Categories</div>
                  <div className="muted text-sm">Organize SKUs and track profitability.</div>
                </div>
                <div className="card">
                  <div className="text-sm font-semibold">Stock Adjustments</div>
                  <div className="muted text-sm">Record stock moves with clear audit trail.</div>
                </div>
                <div className="card">
                  <div className="text-sm font-semibold">Orders & Partners</div>
                  <div className="muted text-sm">Manage suppliers, customers, and order flow.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="panel">
            <div className="badge">Speed</div>
            <h3 className="mt-3 text-lg font-semibold">Move fast</h3>
            <p className="muted text-sm">Quickly add products, adjust stock, and fulfill orders.</p>
          </div>
          <div className="panel">
            <div className="badge">Clarity</div>
            <h3 className="mt-3 text-lg font-semibold">Know your numbers</h3>
            <p className="muted text-sm">See valuation, low stock, and activity at a glance.</p>
          </div>
          <div className="panel">
            <div className="badge">Control</div>
            <h3 className="mt-3 text-lg font-semibold">Built for teams</h3>
            <p className="muted text-sm">Role-ready access and clean workflow handoffs.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
