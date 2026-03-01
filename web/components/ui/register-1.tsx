'use client'

import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image';
import { Mail, Lock, Plus } from "lucide-react";
import { registerLocalUser } from '@/app/actions';

interface InputProps {
    label?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    [key: string]: any;
}

const AppInput = (props: InputProps) => {
    const { label, placeholder, icon, ...rest } = props;
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div className="w-full min-w-[200px] relative">
            {label &&
                <label className='block mb-2 text-sm'>
                    {label}
                </label>
            }
            <div className="relative w-full">
                <input
                    className="peer relative z-10 border-2 border-[var(--color-border)] h-13 w-full rounded-md bg-[var(--color-surface)] px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium text-[var(--color-text-primary)]"
                    placeholder={placeholder}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    {...rest}
                />
                {isHovering && (
                    <>
                        <div
                            className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
                            style={{
                                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
                            }}
                        />
                        <div
                            className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
                            style={{
                                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
                            }}
                        />
                    </>
                )}
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)]">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

const Page = () => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleMouseMove = (e: React.MouseEvent) => {
        const leftSection = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - leftSection.left,
            y: e.clientY - leftSection.top
        });
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError("");
        try {
            await registerLocalUser(formData);
        } catch (e: any) {
            setError(e.message || "Failed to create account.");
            setIsLoading(false);
        }
    }

    const stockImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

    return (
        <div className="min-h-screen w-full bg-[var(--color-bg)] flex items-center justify-center p-4 text-[var(--color-text-primary)]">
            <div className='card w-full max-w-5xl flex justify-between h-[600px] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl relative'>

                {/* Left Side: Gradient UI */}
                <div
                    className='w-full lg:w-1/2 px-4 lg:px-16 left h-full relative overflow-hidden bg-[var(--color-surface)] flex flex-col justify-center'
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Moving Gradient Orb (Slightly warmer colors for Register) */}
                    <div
                        className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-full blur-3xl transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    />

                    <div className="form-container sign-in-container h-full z-10 flex flex-col justify-center w-full max-w-sm mx-auto">
                        <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--color-heading)] mb-2 group'>
                            Create Setup
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                            Everything stays local on your hardware. No cloud.
                        </p>

                        <form action={handleSubmit} className='grid gap-6'>
                            <div className='grid gap-4'>
                                <AppInput
                                    placeholder="Provide a username"
                                    name="username"
                                    type="text"
                                    icon={<Mail size={20} />}
                                    required
                                />
                                <AppInput
                                    placeholder="Create offline password"
                                    name="password"
                                    type="password"
                                    icon={<Lock size={20} />}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className='flex items-center justify-between mt-2'>
                                <a href="/login" className='font-light text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors'>
                                    Back to login
                                </a>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--color-text-primary)]/20 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="flex items-center gap-2 relative z-10 whitespace-nowrap">
                                        {isLoading ? "Setting up..." : "Create Vault"}
                                        {!isLoading && <Plus size={16} />}
                                    </span>
                                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                                        <div className="relative h-full w-8 bg-white/10" />
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side Image Banner */}
                <div className='hidden lg:block w-1/2 right h-full relative overflow-hidden bg-black'>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] to-transparent z-10 mix-blend-multiply opacity-50" />
                    <Image
                        src={stockImage}
                        loader={({ src }) => src}
                        width={1000}
                        height={1000}
                        priority
                        alt="Security vault abstract visualization"
                        className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity duration-700 hover:scale-[1.03]"
                    />
                </div>
            </div>
        </div>
    )
}

export default Page;
