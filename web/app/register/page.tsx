'use client'

import { Receipt, AlertCircle } from "lucide-react";
import { registerLocalUser } from "../actions";
import { useState } from "react";

export default function RegisterPage() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError("");
        try {
            await registerLocalUser(formData);
            // On success, redirect happens in the server action
        } catch (e: any) {
            setError(e.message || "Failed to register account.");
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="flex justify-center mb-6 relative">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-2">Create Account</h1>
                <p className="text-zinc-400 text-sm text-center mb-8">
                    Fully offline. Your data never leaves your network.
                </p>

                {error && (
                    <div className="mb-4 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            placeholder="e.g. alice_home"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Creating vault..." : "Create Account"}
                    </button>

                    <p className="text-center text-sm text-zinc-500 mt-6">
                        Already have a vault?{' '}
                        <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            Sign in
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
