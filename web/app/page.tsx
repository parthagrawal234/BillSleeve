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
      <section id="features" className="bg-black py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
              Everything you need.
            </h2>
            <p className="mt-6 text-neutral-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium tracking-tight">
              Built for privacy-first users who want total control over their
              financial records and product warranties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[32px] border border-white/5 bg-[#0a0a0a] p-10 hover:bg-[#111111] transition-colors duration-500 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-linear-to-b from-neutral-800 to-[#0a0a0a] border border-white/8 flex items-center justify-center text-white mb-8 shadow-2xl">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-2xl mb-3 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-neutral-400 text-base leading-relaxed tracking-tight">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-black py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
              How it works.
            </h2>
            <p className="mt-6 text-neutral-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium tracking-tight">
               Zero manual entry. Ultimate privacy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", label: "Photograph", desc: "Take a photo of any receipt with the mobile app." },
              { step: "02", label: "Read", desc: "OpenCV + Tesseract extracts the data in any language." },
              { step: "03", label: "Store", desc: "Encrypted on your device. Server never sees the original." },
              { step: "04", label: "Register", desc: "Browser agent auto-registers warranties on brand websites." },
            ].map((item) => (
              <div key={item.step} className="text-left rounded-[32px] border border-white/5 bg-[#0a0a0a] p-10 relative overflow-hidden group hover:bg-[#111111] transition-colors duration-500">
                <div className="absolute top-0 right-0 p-8 text-7xl font-bold text-white/2 tracking-tighter select-none transition-colors duration-500 group-hover:text-white/4">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-2xl mb-4 tracking-tight mt-12 relative z-10">
                  {item.label}
                </h3>
                <p className="text-neutral-400 text-base leading-relaxed tracking-tight relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/10 py-16 px-6 text-center text-neutral-500 text-sm">
        <p className="font-medium">
          BillSleeve — Open source, offline-first bill & warranty manager.
        </p>
        <p className="mt-2 text-neutral-600">MIT License · Built with FastAPI, OpenCV, Playwright, Next.js</p>
      </footer>
    </main>
  );
}
