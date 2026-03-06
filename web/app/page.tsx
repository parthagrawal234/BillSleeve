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
      <ScrollSequence frameCount={192} />

    </main>
  );
}
