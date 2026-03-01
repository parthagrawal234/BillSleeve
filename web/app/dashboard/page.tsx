import { Receipt, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";

// Mock data — replace with real API calls to backend
const stats = [
    { label: "Total Bills", value: "24", icon: <Receipt className="w-5 h-5" /> },
    { label: "Active Warranties", value: "18", icon: <Shield className="w-5 h-5" /> },
    { label: "Expiring Soon", value: "3", icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
    { label: "Registered", value: "15", icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
];

const recentBills = [
    { id: "1", store: "Sony Electronics", amount: 28999, date: "2026-01-15", warranty: "2 yr", status: "registered" },
    { id: "2", store: "Samsung Store", amount: 54999, date: "2026-01-22", warranty: "1 yr", status: "registered" },
    { id: "3", store: "Apple Store", amount: 89999, date: "2026-02-01", warranty: "1 yr", status: "pending" },
    { id: "4", store: "LG Electronics", amount: 34999, date: "2026-02-10", warranty: "2 yr", status: "failed" },
    { id: "5", store: "Bosch Appliances", amount: 12999, date: "2026-02-20", warranty: "5 yr", status: "pending" },
];

const warranties = [
    { product: "Sony WH-1000XM5", brand: "Sony", expires: "2028-01-15", daysLeft: 685, status: "registered" },
    { product: "Samsung QLED TV 65\"", brand: "Samsung", expires: "2027-01-22", daysLeft: 327, status: "registered" },
    { product: "iPhone 16 Pro", brand: "Apple", expires: "2027-02-01", daysLeft: 337, status: "pending" },
    { product: "LG Washing Machine", brand: "LG", expires: "2028-02-10", daysLeft: 710, status: "failed" },
    { product: "Bosch Dishwasher", brand: "Bosch", expires: "2031-02-20", daysLeft: 1817, status: "pending" },
];

const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
        registered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
        failed: "bg-red-500/15 text-red-400 border-red-500/20",
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? styles.pending}`}>
            {status}
        </span>
    );
};

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* ── Navbar ────────────────────────────────────────────────── */}
            <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-indigo-400" />
                    <span className="font-bold text-lg tracking-tight">BillSleeve</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <a href="/dashboard" className="text-white">Dashboard</a>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                        Upload Bill
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ── Page header ───────────────────────────────────────── */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-zinc-400 mt-1">Your bills, warranties and agent activity at a glance.</p>
                </div>

                {/* ── Stats ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                                {s.icon}
                                {s.label}
                            </div>
                            <div className="text-4xl font-bold">{s.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* ── Recent Bills ────────────────────────────────────── */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-400" />
                            Recent Bills
                        </h2>
                        <div className="space-y-3">
                            {recentBills.map((bill) => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{bill.store}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{bill.date} · {bill.warranty} warranty</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-mono">₹{bill.amount.toLocaleString()}</span>
                                        {statusBadge(bill.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Warranties ──────────────────────────────────────── */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Warranty Tracker
                        </h2>
                        <div className="space-y-3">
                            {warranties.map((w) => (
                                <div
                                    key={w.product}
                                    className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{w.product}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Expires {w.expires} ·{" "}
                                            <span className={w.daysLeft < 365 ? "text-amber-400" : "text-emerald-400"}>
                                                {w.daysLeft} days left
                                            </span>
                                        </p>
                                    </div>
                                    {statusBadge(w.status)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Agent Activity ────────────────────────────────────── */}
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Browser Agent Activity
                    </h2>
                    <div className="space-y-2">
                        {[
                            { time: "2 min ago", action: "Registered Sony WH-1000XM5 warranty", tier: 1, ok: true },
                            { time: "14 min ago", action: "Registered Samsung QLED TV warranty", tier: 1, ok: true },
                            { time: "1 hr ago", action: "Failed to register LG Washing Machine warranty", tier: 3, ok: false },
                            { time: "3 hr ago", action: "Registered Bosch dishwasher warranty", tier: 2, ok: true },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-zinc-800 last:border-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                                <span className="text-zinc-400 text-xs w-20 flex-shrink-0">{log.time}</span>
                                <span className={log.ok ? "text-zinc-200" : "text-red-400"}>{log.action}</span>
                                <span className="ml-auto text-xs text-zinc-600">Tier {log.tier}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
