"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Receipt,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Bot,
  Zap,
} from "lucide-react";
import { logoutLocalUser } from "@/app/actions";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface StatItem {
  label: string;
  value: string;
  color: string;        // accent CSS class like "text-indigo-400"
  glow: string;         // glow hex for drop-shadow
  progressPct: number;  // 0-100
  icon: React.ReactNode;
}

interface Bill {
  id: string | number;
  store_name?: string;
  purchase_date?: string;
  total_amount?: number | string;
}

interface Warranty {
  id: string | number;
  product_name?: string;
  expires_at?: string;
  registered?: boolean;
}

interface NeuDashboardProps {
  stats: StatItem[];
  bills: Bill[];
  warranties: Warranty[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stat Counter – counts from 0 → target over 1.8 s with a final scale pulse
───────────────────────────────────────────────────────────────────────────── */
function StatCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const [pulse, setPulse] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const DURATION = 1800;

  useEffect(() => {
    const step = (now: number) => {
      if (start.current === null) start.current = now;
      const elapsed = now - start.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return (
    <span
      className="text-5xl font-bold tracking-tight transition-transform duration-300"
      style={{
        fontFamily: "'General Sans', sans-serif",
        transform: pulse ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {display}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shimmer Progress Bar
───────────────────────────────────────────────────────────────────────────── */
function ShimmerBar({ pct, glow }: { pct: number; glow: string }) {
  return (
    <div
      className="relative h-1.5 w-full rounded-full overflow-hidden mt-4"
      style={{
        background: "var(--nm-shadow)",
        boxShadow: `inset 2px 2px 4px var(--nm-shadow), inset -2px -2px 4px var(--nm-light)`,
      }}
    >
      {/* filled */}
      <div
        className="h-full rounded-full relative"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${glow}99, ${glow})`,
          filter: `drop-shadow(0 0 4px ${glow})`,
          transition: "width 1.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* shimmer overlay */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "waveShimmer 2s infinite linear",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Floating Icon Wrapper
───────────────────────────────────────────────────────────────────────────── */
function FloatIcon({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "nmFloat 3s ease-in-out infinite" }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Neumorphic flat card shell
───────────────────────────────────────────────────────────────────────────── */
function NmCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-3xl p-6 ${className}`}
      style={{
        background: "var(--nm-bg)",
        boxShadow:
          "6px 6px 14px var(--nm-shadow), -6px -6px 14px var(--nm-light)",
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Neumorphic inset row
───────────────────────────────────────────────────────────────────────────── */
function NmInsetRow({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-3 ${className}`}
      style={{
        background: "var(--nm-bg)",
        boxShadow:
          "inset 4px 4px 8px var(--nm-shadow), inset -4px -4px 8px var(--nm-light)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Status badge
───────────────────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; glow: string }> = {
    registered: { bg: "#10b98120", text: "#10b981", glow: "#10b981" },
    pending:    { bg: "#f59e0b20", text: "#f59e0b", glow: "#f59e0b" },
    failed:     { bg: "#f43f5e20", text: "#f43f5e", glow: "#f43f5e" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="text-xs px-3 py-1 rounded-full font-medium"
      style={{
        fontFamily: "'Satoshi', sans-serif",
        background: s.bg,
        color: s.text,
        boxShadow: `0 0 6px ${s.glow}55`,
      }}
    >
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Neumorphic button
───────────────────────────────────────────────────────────────────────────── */
function NmButton({
  children,
  action,
  className = "",
}: {
  children: React.ReactNode;
  action?: () => void;
  className?: string;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={action}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium select-none ${className}`}
      style={{
        fontFamily: "'Satoshi', sans-serif",
        background: "var(--nm-bg)",
        color: "var(--nm-text)",
        boxShadow: pressed
          ? "inset 4px 4px 8px var(--nm-shadow), inset -4px -4px 8px var(--nm-light)"
          : "6px 6px 14px var(--nm-shadow), -6px -6px 14px var(--nm-light)",
        transform: pressed ? "scale(0.97)" : "translateY(0) scale(1)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={(e) => {
        if (!pressed) {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-2px) scale(1.04)";
        }
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────────────────────────────── */
export function NeuDashboard({ stats, bills, warranties }: NeuDashboardProps) {
  return (
    <>
      {/* Inject CSS variables + keyframes */}
      <style>{`
        :root, html {
          --nm-bg:     #1e2030;
          --nm-light:  #2a2d42;
          --nm-shadow: #14152a;
          --nm-text:   #c8cde4;
          --nm-muted:  #6b7280;
        }

        @keyframes waveShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes nmFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }

        @keyframes statPulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: "var(--nm-bg)",
          color: "var(--nm-text)",
          fontFamily: "'Satoshi', sans-serif",
        }}
      >
        {/* ── Navbar ──────────────────────────────────────────────────── */}
        <nav
          className="px-6 py-5 flex items-center justify-between sticky top-0 z-10"
          style={{
            background: "var(--nm-bg)",
            boxShadow: "0 4px 16px var(--nm-shadow)",
          }}
        >
          <div className="flex items-center gap-3">
            <FloatIcon>
              <Receipt className="w-6 h-6 text-indigo-400" />
            </FloatIcon>
            <a
              href="/"
              className="font-bold text-xl"
              style={{ fontFamily: "'General Sans', sans-serif", color: "var(--nm-text)" }}
            >
              Bill<span style={{ color: "#6366f1" }}>Sleeve</span>
            </a>
          </div>

          <form action={logoutLocalUser}>
            <NmButton className="text-rose-400">
              <LogOut className="w-4 h-4" />
              Sign out
            </NmButton>
          </form>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* ── Header ────────────────────────────────────────────────── */}
          <div>
            <h1
              className="text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "'General Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              Dashboard
            </h1>
            <p style={{ color: "var(--nm-muted)", marginTop: 4, fontSize: 14 }}>
              Your bills, warranties and agent activity at a glance.
            </p>
          </div>

          {/* ── Stat Cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s) => (
              <NmCard key={s.label} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--nm-muted)", fontFamily: "'Satoshi', sans-serif" }}
                  >
                    {s.label}
                  </span>
                  <FloatIcon>
                    <span className={s.color}>{s.icon}</span>
                  </FloatIcon>
                </div>
                <StatCounter target={parseInt(s.value) || 0} />
                <ShimmerBar pct={s.progressPct} glow={s.glow} />
              </NmCard>
            ))}
          </div>

          {/* ── Bills + Warranties ────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Bills */}
            <NmCard>
              <h2
                className="text-lg font-semibold mb-5 flex items-center gap-2"
                style={{ fontFamily: "'General Sans', sans-serif", letterSpacing: "-0.02em" }}
              >
                <FloatIcon><Receipt className="w-5 h-5 text-indigo-400" /></FloatIcon>
                Recent Bills
              </h2>
              {bills.length === 0 ? (
                <NmInsetRow className="py-10 text-center" style={{ color: "var(--nm-muted)" }}>
                  <p style={{ color: "var(--nm-muted)" }}>No bills uploaded yet.</p>
                </NmInsetRow>
              ) : (
                <div className="space-y-3">
                  {bills.map((b) => (
                    <NmInsetRow key={b.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--nm-text)" }}>
                          {b.store_name || "Unknown Store"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--nm-muted)" }}>
                          {b.purchase_date || "Unknown Date"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            color: "var(--nm-text)",
                          }}
                        >
                          {b.total_amount ? `₹${Number(b.total_amount).toLocaleString()}` : "—"}
                        </span>
                        <StatusBadge status="registered" />
                      </div>
                    </NmInsetRow>
                  ))}
                </div>
              )}
            </NmCard>

            {/* Warranties */}
            <NmCard>
              <h2
                className="text-lg font-semibold mb-5 flex items-center gap-2"
                style={{ fontFamily: "'General Sans', sans-serif", letterSpacing: "-0.02em" }}
              >
                <FloatIcon><Shield className="w-5 h-5 text-emerald-400" /></FloatIcon>
                Warranty Tracker
              </h2>
              {warranties.length === 0 ? (
                <NmInsetRow className="py-10 text-center">
                  <p style={{ color: "var(--nm-muted)" }}>No warranties auto-registered yet.</p>
                </NmInsetRow>
              ) : (
                <div className="space-y-3">
                  {warranties.map((w) => (
                    <NmInsetRow key={w.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--nm-text)" }}>
                          {w.product_name || "Unknown Product"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--nm-muted)" }}>
                          Expires {w.expires_at || "—"}
                        </p>
                      </div>
                      <StatusBadge status={w.registered ? "registered" : "pending"} />
                    </NmInsetRow>
                  ))}
                </div>
              )}
            </NmCard>
          </div>

          {/* ── Agent Activity Terminal ──────────────────────────────── */}
          <NmCard>
            <h2
              className="text-lg font-semibold mb-5 flex items-center gap-2"
              style={{ fontFamily: "'General Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              <FloatIcon><Bot className="w-5 h-5 text-violet-400" /></FloatIcon>
              Browser Agent Activity
            </h2>
            <NmInsetRow>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#10b981",
                  minHeight: 120,
                  lineHeight: "1.8",
                  padding: "4px 8px",
                }}
              >
                <p><span style={{ color: "#6366f1" }}>[agent]</span> Session initialised — ready to accept jobs.</p>
                <p><span style={{ color: "#6366f1" }}>[agent]</span> Playwright chromium sandbox: <span style={{ color: "#10b981" }}>healthy ✓</span></p>
                <p><span style={{ color: "#f59e0b" }}>[agent]</span> No active warranty registration jobs queued.</p>
                <p style={{ color: "var(--nm-muted)" }}>Upload a bill with a product to trigger auto-registration.</p>
              </div>
            </NmInsetRow>
          </NmCard>

          {/* ── Quick Actions ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-10">
            {[
              { label: "Upload a Bill",        icon: <Receipt className="w-5 h-5" />,  color: "#6366f1" },
              { label: "Register Warranty",    icon: <Shield className="w-5 h-5" />,   color: "#10b981" },
              { label: "Run Agent Now",        icon: <Zap className="w-5 h-5" />,     color: "#8b5cf6" },
            ].map((a) => (
              <NmCard key={a.label} className="cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${a.color}20`,
                      boxShadow: `inset 3px 3px 6px var(--nm-shadow), inset -3px -3px 6px var(--nm-light)`,
                      color: a.color,
                      filter: `drop-shadow(0 0 6px ${a.color}55)`,
                    }}
                  >
                    <FloatIcon>{a.icon}</FloatIcon>
                  </div>
                  <span
                    className="font-semibold"
                    style={{ fontFamily: "'General Sans', sans-serif", color: "var(--nm-text)" }}
                  >
                    {a.label}
                  </span>
                </div>
              </NmCard>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
