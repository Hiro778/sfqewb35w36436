import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ClickSpark from "@/components/magic/ClickSpark";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await login(email, password);
            nav("/");
        } catch (err) {
            // toast handled in context
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
                <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">
                    Welcome back
                </p>
                <h1 className="font-display text-3xl mt-2">Login</h1>
                <p className="text-sm text-zinc-400 mt-2">Masuk untuk melihat pesanan Anda.</p>

                <form onSubmit={submit} className="space-y-3 mt-6">
                    <input
                        type="email"
                        required
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="login-email"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="login-password"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <ClickSpark className="block">
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="login-submit"
                            className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40"
                        >
                            {busy ? "Loading..." : "Login"}
                        </button>
                    </ClickSpark>
                </form>

                <div className="flex justify-between text-sm mt-6 text-zinc-400">
                    <Link to="/forgot-password" className="hover:text-brand-200">
                        Lupa password?
                    </Link>
                    <Link to="/register" className="hover:text-brand-200">
                        Belum punya akun?
                    </Link>
                </div>
            </div>
        </div>
    );
}
