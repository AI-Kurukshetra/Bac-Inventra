import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="container">
        <header className="flex items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/bac-inventra-logo.svg"
              alt="Bac-Inventra"
              className="h-9 w-auto"
            />
            <div className="hidden sm:block">
              <div className="text-lg font-semibold tracking-tight">Bac-Inventra</div>
              <div className="text-xs text-muted">Inventory OS for growing teams</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 text-sm text-muted">
            <a className="nav-link" href="#features">Features</a>
            <a className="nav-link" href="#workflow">Workflow</a>
            <a className="nav-link" href="#reports">Reports</a>
            <a className="nav-link" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="button secondary" href="/login">Sign In</Link>
            <Link className="button" href="/login">Get Started</Link>
          </div>
        </header>

        <section className="relative mt-10 overflow-hidden rounded-3xl border border-border bg-white/80 p-8 shadow-soft lg:p-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ae6ff55,transparent_65%)]" />
            <div className="absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,#a78bfa40,transparent_70%)]" />
          </div>
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ff] bg-[#f5f7ff] px-3 py-1 text-xs font-semibold text-[#4f46e5]">
                Built for fast-moving inventory teams
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Control stock, orders, and operations in one calm workspace.
              </h1>
              <p className="mt-4 text-base text-muted md:text-lg">
                Bac-Inventra helps you track products, suppliers, customers, and every stock move with clarity.
                Keep teams aligned, reduce surprises, and scale without chaos.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link className="button" href="/login">Start free trial</Link>
                <Link className="button secondary" href="/login">Request demo</Link>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="card">
                  <div className="text-xs uppercase tracking-[0.12em] text-muted">Accuracy</div>
                  <div className="mt-2 text-2xl font-bold">99.4%</div>
                  <div className="text-xs text-muted">Stock confidence</div>
                </div>
                <div className="card">
                  <div className="text-xs uppercase tracking-[0.12em] text-muted">Speed</div>
                  <div className="mt-2 text-2xl font-bold">3x</div>
                  <div className="text-xs text-muted">Faster audits</div>
                </div>
                <div className="card">
                  <div className="text-xs uppercase tracking-[0.12em] text-muted">Coverage</div>
                  <div className="mt-2 text-2xl font-bold">5+</div>
                  <div className="text-xs text-muted">Core modules</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="panel">
                <div className="text-sm font-semibold">Live workspace preview</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="card">
                    <div className="text-xs uppercase tracking-wide text-muted">On hand</div>
                    <div className="kpi">4,280</div>
                  </div>
                  <div className="card">
                    <div className="text-xs uppercase tracking-wide text-muted">Low stock</div>
                    <div className="kpi">12</div>
                  </div>
                  <div className="card">
                    <div className="text-xs uppercase tracking-wide text-muted">Suppliers</div>
                    <div className="kpi">28</div>
                  </div>
                  <div className="card">
                    <div className="text-xs uppercase tracking-wide text-muted">Orders</div>
                    <div className="kpi">36</div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 rounded-2xl border border-border bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Today’s highlights</div>
                    <div className="text-xs text-muted">Auto-generated summary</div>
                  </div>
                  <span className="status approved">On track</span>
                </div>
                <div className="grid gap-2 text-sm text-muted">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <span>12 items need reorder</span>
                    <span className="text-ink">$2,320</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <span>3 PO approvals pending</span>
                    <span className="text-ink">Today</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                    <span>6 shipments scheduled</span>
                    <span className="text-ink">This week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="badge">Core features</div>
              <h2 className="mt-3 text-2xl font-semibold">Everything you need to run inventory at scale</h2>
              <p className="mt-2 text-sm text-muted">
                Organize SKUs, manage orders, and keep your team aligned in one place.
              </p>
            </div>
            <Link className="button secondary" href="/login">Explore the app</Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Products & Categories",
                desc: "Flexible catalogs, clean SKU structures, and searchable category controls."
              },
              {
                title: "Purchase & Sales Orders",
                desc: "Draft, approve, and fulfill orders with clear status tracking."
              },
              {
                title: "Stock Adjustments",
                desc: "Audit-ready stock changes with responsible user history."
              },
              {
                title: "Multi-location Inventory",
                desc: "Track balances across warehouses, showrooms, and labs."
              },
              {
                title: "Role-based Access",
                desc: "Control who can approve, edit, or view sensitive operations."
              },
              {
                title: "Billing & Plans",
                desc: "Free and paid tiers with usage limits baked in."
              }
            ].map((feature) => (
              <div key={feature.title} className="panel">
                <div className="text-sm font-semibold">{feature.title}</div>
                <p className="mt-2 text-sm text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel">
            <div className="badge">Workflow</div>
            <h3 className="mt-3 text-xl font-semibold">Run clean operations in three moves</h3>
            <ol className="mt-4 grid gap-4 text-sm text-muted">
              <li className="flex gap-3">
                <span className="h-7 w-7 rounded-full bg-[#eef2ff] text-[#4f46e5] grid place-items-center font-semibold">1</span>
                <div>
                  <div className="text-ink font-semibold">Capture data</div>
                  <div>Add products, suppliers, and locations in minutes.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-7 w-7 rounded-full bg-[#eef2ff] text-[#4f46e5] grid place-items-center font-semibold">2</span>
                <div>
                  <div className="text-ink font-semibold">Move inventory</div>
                  <div>Adjust stock, approve orders, and track transfers.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-7 w-7 rounded-full bg-[#eef2ff] text-[#4f46e5] grid place-items-center font-semibold">3</span>
                <div>
                  <div className="text-ink font-semibold">Report & act</div>
                  <div>See low stock, top movers, and valuation instantly.</div>
                </div>
              </li>
            </ol>
            <div className="mt-6 rounded-xl border border-[#dbe3ff] bg-[#f8f9ff] p-4">
              <div className="text-sm font-semibold text-[#4f46e5]">Team-ready</div>
              <div className="text-sm text-muted">Invite staff, set permissions, and keep every action logged.</div>
            </div>
          </div>
          <div className="panel" id="reports">
            <div className="badge">Reports</div>
            <h3 className="mt-3 text-xl font-semibold">Instant answers for leadership</h3>
            <p className="mt-2 text-sm text-muted">
              From stock valuation to reorder priorities, export-ready insights keep everyone aligned.
            </p>
            <div className="mt-4 grid gap-3">
              {[
                "Inventory valuation by category",
                "Low-stock and reorder alerts",
                "Purchase and sales order status",
                "Adjustments with audit history"
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm">
                  <span>{item}</span>
                  <span className="status">Ready</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="badge">Pricing</div>
              <h2 className="mt-3 text-2xl font-semibold">Simple plans that scale with you</h2>
              <p className="mt-2 text-sm text-muted">Start free, upgrade when your team is ready.</p>
            </div>
            <Link className="button" href="/login">Start free</Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="panel">
              <div className="text-sm font-semibold">Free</div>
              <div className="mt-2 text-3xl font-bold">$0</div>
              <ul className="mt-4 grid gap-2 text-sm text-muted">
                <li>Up to 200 products</li>
                <li>1 location</li>
                <li>Basic reports</li>
              </ul>
            </div>
            <div className="panel border-[#c7d2fe]">
              <div className="text-sm font-semibold text-[#4f46e5]">Pro</div>
              <div className="mt-2 text-3xl font-bold">$39</div>
              <ul className="mt-4 grid gap-2 text-sm text-muted">
                <li>Unlimited products</li>
                <li>Multi-location inventory</li>
                <li>Advanced approvals & audit logs</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-border bg-[#0f172a] p-10 text-white">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h2 className="text-3xl font-semibold">Ready to streamline inventory today?</h2>
              <p className="mt-3 text-sm text-white/70">
                Launch Bac-Inventra in minutes and keep every SKU, supplier, and order under control.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="button" href="/login">Get started</Link>
              <Link className="button secondary" href="/login">Talk to sales</Link>
            </div>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <div>© {new Date().getFullYear()} Bac-Inventra. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Login</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
