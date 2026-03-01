import { Receipt } from "lucide-react";
import { loginLocalUser } from "../actions";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-2">Local Sign In</h1>
                <p className="text-zinc-400 text-sm text-center mb-8">
                    BillSleeve runs entirely offline. No passwords needed. Just pick a username to organize your receipts.
                </p>

                <form action={loginLocalUser} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="e.g. alice_home"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors mt-2"
                    >
                        Enter Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
