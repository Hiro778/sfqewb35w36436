import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
    const { adminLogin, admin } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (admin) {
            nav(admin.first_setup_done ? "/admin" : "/admin/first-setup", { replace: true });
        }
    }, [admin, nav]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await adminLogin(form.username, form.password);
            if (res.requires_first_setup) {
                nav("/admin/first-setup", { replace: true });
            } else {
                nav("/admin", { replace: true });
            }
        } catch (err) {
            // toast handled
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 grid place-items-center px-4 spotlight">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-2 mb-6">
                    <span className="w-9 h-9 rounded-full bg-brand-200 grid place-items-center text-zinc-950 font-display font-bold">
                        H
                    </span>
                    <div>
                        <p className="font-display text-lg leading-none">Hazze'On</p>
                        <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                            Admin Access
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-8">
                    <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">
                        Restricted
                    </p>
                    <h1 className="font-display text-3xl mt-2 flex items-center gap-2">
                        <Lock className="w-6 h-6 text-brand-200" /> Admin Login
                    </h1>
                    <form onSubmit={submit} className="space-y-3 mt-6">
                        <input
                            required
                            placeholder="Username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            data-testid="admin-username"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <input
                            required
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            data-testid="admin-password"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="admin-submit"
                            className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40"
                        >
                            {busy ? "Loading..." : "Masuk"}
                        </button>
                    </form>
                    <div className="mt-6 text-xs text-zinc-500 flex gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p>
                            Login pertama gunakan{" "}
                            <span className="font-mono-alt text-zinc-300">admin / 1234</span>. Setelah
                            setup, kredensial default akan dinonaktifkan permanen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
