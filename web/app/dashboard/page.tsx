import { Receipt, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { cookies } from "next/headers";
import { NeuDashboard } from "@/components/ui/neu-dashboard";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    let recentBills: any[] = [];
    let warranties: any[] = [];
    let totalBills = 0;
    let activeWarranties = 0;
    let registered = 0;
    let expiringSoon = 0;

    if (token) {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";
            const authHeader = { "Authorization": token };

            const res = await fetch(`${apiUrl}/api/bills/`, { headers: authHeader, cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                recentBills = data.bills || [];
                totalBills = recentBills.length;
            }

            const wRes = await fetch(`${apiUrl}/api/warranties/`, { headers: authHeader, cache: "no-store" });
            if (wRes.ok) {
                const data = await wRes.json();
                warranties = data.warranties || [];
                activeWarranties = warranties.length;
                registered = warranties.filter((w: any) => w.registered).length;
                // "Expiring soon" = within 30 days
                const now = Date.now();
                expiringSoon = warranties.filter((w: any) => {
                    if (!w.expires_at) return false;
                    const exp = new Date(w.expires_at).getTime();
                    return exp - now < 30 * 24 * 60 * 60 * 1000 && exp > now;
                }).length;
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data:", e);
        }
    }

    const stats = [
        {
            label: "Total Bills",
            value: String(totalBills),
            color: "text-indigo-400",
            glow: "#6366f1",
            progressPct: Math.min(totalBills * 10, 100),
            icon: <Receipt className="w-5 h-5" />,
        },
        {
            label: "Warranties",
            value: String(activeWarranties),
            color: "text-emerald-400",
            glow: "#10b981",
            progressPct: Math.min(activeWarranties * 10, 100),
            icon: <Shield className="w-5 h-5" />,
        },
        {
            label: "Expiring Soon",
            value: String(expiringSoon),
            color: "text-amber-400",
            glow: "#f59e0b",
            progressPct: expiringSoon > 0 ? Math.min(expiringSoon * 20, 100) : 0,
            icon: <AlertTriangle className="w-5 h-5" />,
        },
        {
            label: "Registered",
            value: String(registered),
            color: "text-violet-400",
            glow: "#8b5cf6",
            progressPct: activeWarranties > 0 ? Math.round((registered / activeWarranties) * 100) : 0,
            icon: <CheckCircle className="w-5 h-5" />,
        },
    ];

    return (
        <NeuDashboard
            stats={stats}
            bills={recentBills}
            warranties={warranties}
        />
    );
}
