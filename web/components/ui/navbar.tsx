"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/60 backdrop-blur-2xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-white font-semibold text-lg tracking-tight">
            Bill<span className="text-white/50">Sleeve</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "#features" },
            { label: "GitHub", href: "https://github.com/parthagrawal234/BillSleeve" },
            { label: "About", href: "/about" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/70 font-medium hover:text-white transition-colors duration-200 tracking-tight"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="px-5 py-2 rounded-full text-sm font-semibold tracking-tight bg-white text-black hover:bg-white/90 transition-all duration-200 hover:scale-105"
        >
          Open App
        </Link>
      </div>
    </nav>
  );
}
