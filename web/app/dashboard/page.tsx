import { Receipt, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

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

export default async function DashboardPage() {
    // 1. Get the securely verified Clerk user_id on the server side
    const { userId } = await auth();

    // 2. Fetch the user's actual bills from FastAPI
    // Use localhost if not in docker, but NEXT_PUBLIC_API_URL handles environment
    let recentBills: any[] = [];
    let stats = [
        { label: "Total Bills", value: "0", icon: <Receipt className="w-5 h-5" /> },
        { label: "Active Warranties", value: "0", icon: <Shield className="w-5 h-5" /> },
        { label: "Expiring Soon", value: "0", icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
        { label: "Registered", value: "0", icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
    ];
    let warranties: any[] = [];

    if (userId) {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/bills/`, {
                headers: { "x-user-id": userId },
                cache: "no-store", // don't cache dashboard
            });
            if (res.ok) {
                const data = await res.json();
                recentBills = data.bills || [];
                stats[0].value = recentBills.length.toString();
            }

            // Also fetch warranties securely
            const wRes = await fetch(`${apiUrl}/warranties/`, {
                headers: { "x-user-id": userId },
                cache: "no-store",
            });
            if (wRes.ok) {
                const data = await wRes.json();
                warranties = data.warranties || [];
                stats[1].value = warranties.length.toString();
                stats[3].value = warranties.filter((w: any) => w.registered).length.toString();
            }

        } catch (e) {
            console.error("Failed to fetch dashboard data:", e);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* ── Navbar ────────────────────────────────────────────────── */}
            <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-indigo-400" />
                    <a href="/" className="font-bold text-lg tracking-tight hover:text-zinc-300">BillSleeve</a>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="bg-white hover:bg-zinc-200 text-black px-4 py-1.5 rounded-lg font-medium transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
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
                        {recentBills.length === 0 ? (
                            <div className="py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                                No bills uploaded yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentBills.map((bill: any) => (
                                    <div
                                        key={bill.id}
                                        className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{bill.store_name || "Unknown Store"}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{bill.purchase_date || "Unknown Date"}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono">
                                                {bill.total_amount ? `₹${Number(bill.total_amount).toLocaleString()}` : '—'}
                                            </span>
                                            {statusBadge("registered")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Warranties ──────────────────────────────────────── */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Warranty Tracker
                        </h2>
                        {warranties.length === 0 ? (
                            <div className="py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                                No warranties auto-registered yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {warranties.map((w: any) => (
                                    <div
                                        key={w.id}
                                        className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{w.product_name || "Unknown Product"}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                Expires {w.expires_at || "—"}
                                            </p>
                                        </div>
                                        {statusBadge(w.registered ? "registered" : "pending")}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Agent Activity ────────────────────────────────────── */}
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Browser Agent Activity
                    </h2>
                    <div className="space-y-2">
                        <div className="py-2 text-zinc-500 text-sm">
                            Real agent history logic goes here.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
