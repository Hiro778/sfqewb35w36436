import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ClickSpark from "@/components/magic/ClickSpark";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await register(form);
            nav("/");
        } catch (err) {
            // toast handled
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
                <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">
                    Get started
                </p>
                <h1 className="font-display text-3xl mt-2">Buat Akun</h1>

                <form onSubmit={submit} className="space-y-3 mt-6">
                    <input
                        required
                        placeholder="Nama lengkap"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        data-testid="register-name"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        type="email"
                        required
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        data-testid="register-email"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        placeholder="No WhatsApp (opsional)"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        data-testid="register-phone"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Password (min 6 karakter)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        data-testid="register-password"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <ClickSpark className="block">
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="register-submit"
                            className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40"
                        >
                            {busy ? "Loading..." : "Buat Akun"}
                        </button>
                    </ClickSpark>
                </form>

                <p className="text-sm text-zinc-400 mt-6 text-center">
                    Sudah punya akun?{" "}
                    <Link to="/login" className="text-brand-200 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
