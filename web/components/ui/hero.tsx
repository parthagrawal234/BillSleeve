"use client";

import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";

const teamAvatars = [
    {
        initials: "JD",
        src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
    },
    {
        initials: "HJ",
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    {
        initials: "PI",
        src: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face",
    },
    {
        initials: "KD",
        src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    {
        initials: "LD",
        src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
];

const stats = [
    { emoji: "🧾", label: "BILLS SCANNED & STORED", value: "10,000+" },
    { emoji: "🛡️", label: "WARRANTIES AUTO-REGISTERED", value: "8,500+" },
    { emoji: "💰", label: "IN WARRANTIES NEVER LOST", value: "$2M+" },
    { emoji: "🌍", label: "LANGUAGES SUPPORTED BY OCR", value: "100+" },
];

function AvatarStack() {
    return (
        <div className="flex -space-x-3">
            {teamAvatars.map((member, i) => (
                <Avatar
                    key={member.initials}
                    className="size-12 border-2 border-primary bg-neutral-800"
                    style={{ zIndex: teamAvatars.length - i }}
                >
                    <AvatarImage alt={`User ${i + 1}`} src={member.src} />
                    <AvatarFallback className="bg-neutral-700 text-white text-xs">
                        {member.initials}
                    </AvatarFallback>
                </Avatar>
            ))}
        </div>
    );
}

function StatsMarquee() {
    return (
        <Marquee
            className="border-white/10 border-y bg-black/30 py-2 backdrop-blur-sm [--duration:30s] [--gap:2rem]"
            pauseOnHover
            repeat={4}
        >
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex items-center gap-3 whitespace-nowrap"
                >
                    <span className="font-bold font-mono text-primary text-sm tracking-wide">
                        {stat.value}
                    </span>
                    <span className="font-medium font-mono text-sm text-white/70 uppercase tracking-[0.15em]">
                        {stat.label}
                    </span>
                    <span className="text-base">{stat.emoji}</span>
                </div>
            ))}
        </Marquee>
    );
}

export default function Hero() {
    return (
        <section className="relative flex h-screen w-full flex-col items-start justify-end">
            {/* Background image with overlay */}
            <div
                className="absolute inset-0 bg-center bg-cover"
                style={{
                    backgroundImage:
                        "url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80)",
                }}
            >
                <div className="absolute inset-0 bg-black/55" />
            </div>

            {/* Marquee strip pinned above the text  */}
            <div className="relative z-10 w-full max-w-4xl px-4 sm:px-8 lg:px-16 mb-2">
                <div className="space-y-4">
                    <AvatarStack />
                    <StatsMarquee />
                </div>
            </div>

            {/* Main copy */}
            <div className="relative z-10 w-full px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                    {/* Left: headline + CTA */}
                    <div className="w-full space-y-4 sm:w-1/2">
                        <h1 className="font-medium text-4xl text-white leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            We{" "}
                            <span className="text-primary">scan</span>, you{" "}
                            <span className="text-primary">save</span>
                            <br />
                            <span className="text-white">— that's the deal</span>
                        </h1>

                        <Button
                            asChild
                            className="rounded-none py-0 pr-0 font-normal text-black text-lg"
                        >
                            <a href="/dashboard">
                                Open Dashboard
                                <span className="border-neutral-500 border-l p-3 ml-2">
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            </a>
                        </Button>
                    </div>

                    {/* Right: tagline */}
                    <div className="w-full sm:w-1/2">
                        <p className="text-base text-primary italic sm:text-right md:text-2xl">
                            BillSleeve reads your receipts in any language, stores them
                            privately with zero-knowledge encryption, and auto-registers your
                            warranties — all offline, no API costs.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
