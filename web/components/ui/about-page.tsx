"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

interface AboutPageProps {
    achievements?: Array<{ label: string; value: string }>
}

const defaultAchievements = [
    { label: "Companies Supported", value: "300+" },
    { label: "Projects Finalized", value: "800+" },
    { label: "Happy Customers", value: "99%" },
    { label: "Recognized Awards", value: "10+" },
]

export default function AboutPage({
    achievements = defaultAchievements,
}: AboutPageProps) {
    return (
        <div className="flex flex-col">

            {/* ---------------- HERO SECTION ---------------- */}
            <section className="py-16 md:py-28 bg-background">
                <div className="mx-auto max-w-6xl space-y-2 px-6">
                    <Image
                        className="rounded-xl object-cover w-full h-[240px] md:h-[460px]"
                        src="https://images.unsplash.com/photo-1623039405147-547794f92e9e?q=80&w=2626&auto=format&fit=crop"
                        alt="Hero section image"
                        width={1200}
                        height={600}
                        priority
                    />

                    <div className="grid gap-6 md:grid-cols-2 md:gap-12 mt-10">
                        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white leading-snug">
                            Providing <span className="text-indigo-400">Offline-first</span>{" "}
                            <span className="text-gray-500 dark:text-gray-400">
                                security and sovereignty over your personal records.
                            </span>
                        </h1>
                        <div className="space-y-6 text-muted-foreground">
                            <p>
                                BillSleeve is evolving to be more than just an offline ledger. It supports an entire local-only ecosystem —
                                from receipt AI scanning to completely self-hosted, sovereign infrastructure for power users.
                            </p>
                            <Button
                                asChild
                                variant="secondary"
                                size="sm"
                                className="gap-1 pr-1.5"
                            >
                                <Link href="#">
                                    <span>Learn More</span>
                                    <ChevronRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------- ABOUT SECTION ---------------- */}
            <section className="py-20 md:py-28">
                <div className="mx-auto max-w-6xl space-y-16 px-6">

                    {/* Header */}
                    <div className="grid gap-6 text-center md:grid-cols-2 md:gap-12 md:text-left">
                        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white">
                            About Us
                        </h1>
                        <p className="text-muted-foreground">
                            We are a passionate team dedicated to creating solutions
                            that empower individuals to maintain true privacy and ownership in the digital age.
                        </p>
                    </div>

                    {/* ---------------- LAST THREE CARDS (NEW LAYOUT) ---------------- */}
                    <div className="flex flex-col md:flex-row gap-6 mt-16">

                        {/* LEFT BIG IMAGE */}
                        <div className="md:flex-1">
                            <Image
                                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
                                alt="Left big image"
                                className="rounded-xl object-cover w-full h-[300px] sm:h-[360px] md:h-full"
                                width={800}
                                height={550}
                            />
                        </div>

                        {/* RIGHT TWO CARDS */}
                        <div className="flex flex-col gap-6 md:flex-1">
                            {/* FIRST CARD */}
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                                className="relative overflow-hidden rounded-xl bg-black text-white shadow-lg"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.4 }}
                                    className="relative h-60 sm:h-64 md:h-48 w-full overflow-hidden"
                                >
                                    <Image
                                        src="https://images.unsplash.com/photo-1542621323-220451b14353?q=80&w=2664&auto=format&fit=crop"
                                        alt="Card Image"
                                        className="h-full w-full object-cover"
                                        width={600}
                                        height={400}
                                    />
                                    <div className="absolute bottom-0 h-32 w-full bg-linear-to-t from-black via-black/70 to-transparent" />
                                </motion.div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold">Encrypted Vault</h3>
                                    <p className="mt-2 text-sm text-gray-300">
                                        Your bills and warranties are encrypted using military-grade AES-256 before ever hitting the disk.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-white text-black dark:text-white hover:bg-white hover:text-black"
                                    >
                                        Learn More
                                    </Button>
                                </div>
                            </motion.div>

                            {/* SECOND CARD */}
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                                className="relative overflow-hidden rounded-xl bg-muted shadow-lg"
                            >
                                <Image
                                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop"
                                    alt="Secondary card"
                                    className="h-full w-full object-cover min-h-[220px] sm:min-h-[240px] md:min-h-[220px]"
                                    width={600}
                                    height={400}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/70 to-transparent text-white">
                                    <h3 className="text-xl font-bold">Zero-API Architecture</h3>
                                    <p className="mt-2 text-sm text-gray-200">
                                        A completely self-hosted local backend ensures no third party ever analytics or harvests your data.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    )
}
