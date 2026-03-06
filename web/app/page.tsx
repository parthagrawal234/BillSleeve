import { ScrollSequence } from "@/components/ui/scroll-sequence";
import { Receipt, Shield, Bot, Globe, Lock, Zap } from "lucide-react";

// ... features array remains the same ...
const features = [
  {
    icon: <Receipt className="w-6 h-6" />,
    title: "Smart Bill Reading",
    description:
      "OpenCV + Tesseract reads any receipt in 100+ languages. No cloud, no API costs — runs entirely on your machine.",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "Auto Warranty Registration",
    description:
      "Our browser agent finds and fills warranty forms on any brand's website automatically — Sony, Samsung, Apple, or any company.",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Zero-Knowledge Encryption",
    description:
      "Your bills are encrypted on your device before they ever leave it. The server only ever sees scrambled data.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Sandboxed Agents",
    description:
      "Every browser agent runs inside its own Docker container — fully isolated, so even a compromised site can't reach your data.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Universal Coverage",
    description:
      "3-tier fallback: known script → heuristic form finder → Google search. Covers every brand, with no manual setup.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Fully Offline",
    description:
      "No API fees, no subscriptions, no data leaving your machine. BillSleeve works completely offline from end to end.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <ScrollSequence frameCount={240} />

      {/* ── Features grid ────────────────────────────────────────────── */}
      <section id="features" className="bg-zinc-950 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              Everything you need
            </h2>
            <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
              Built for privacy-first users who want total control over their
              financial records and product warranties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-600 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-zinc-900 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white tracking-tight mb-6">
            How BillSleeve works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {[
              { step: "01", label: "Photograph", desc: "Take a photo of any receipt with the mobile app" },
              { step: "02", label: "Read", desc: "OpenCV + Tesseract extracts the data in any language" },
              { step: "03", label: "Store", desc: "Encrypted on your device. Server never sees the original." },
              { step: "04", label: "Register", desc: "Browser agent auto-registers warranties on brand websites" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-zinc-700 mb-3">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {item.label}
                </h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-10 px-6 text-center text-zinc-500 text-sm">
        <p>
          BillSleeve — Open source, offline-first bill & warranty manager.
        </p>
        <p className="mt-1">MIT License · Built with FastAPI, OpenCV, Playwright, Next.js</p>
      </footer>
    </main>
  );
}
