import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminFirstSetup() {
    const nav = useNavigate();
    const { refreshAdmin } = useAuth();
    const [form, setForm] = useState({
        current_username: "admin",
        current_password: "1234",
        new_username: "",
        new_password: "",
        new_email: "",
        new_phone: "",
    });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/admin/first-setup", form);
            await refreshAdmin();
            toast.success("Setup awal berhasil. Kredensial default telah dinonaktifkan.");
            nav("/admin", { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 grid place-items-center px-4 py-10">
            <div className="w-full max-w-lg">
                <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold text-center mb-2">
                    First-time setup
                </p>
                <h1 className="font-display text-3xl text-center mb-2">Amankan Akun Admin</h1>
                <p className="text-sm text-zinc-400 text-center mb-8">
                    Kredensial default (admin/1234) akan dinonaktifkan permanen setelah setup ini.
                </p>
                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3"
                >
                    <input
                        placeholder="Username baru (min 3 karakter)"
                        required
                        minLength={3}
                        value={form.new_username}
                        onChange={(e) => setForm({ ...form, new_username: e.target.value })}
                        data-testid="setup-username"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        type="email"
                        placeholder="Email admin"
                        required
                        value={form.new_email}
                        onChange={(e) => setForm({ ...form, new_email: e.target.value })}
                        data-testid="setup-email"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        placeholder="No WhatsApp admin"
                        required
                        value={form.new_phone}
                        onChange={(e) => setForm({ ...form, new_phone: e.target.value })}
                        data-testid="setup-phone"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                        type="password"
                        placeholder="Password baru (min 6 karakter)"
                        required
                        minLength={6}
                        value={form.new_password}
                        onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                        data-testid="setup-password"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        data-testid="setup-submit"
                        className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors"
                    >
                        {busy ? "Menyimpan..." : "Simpan & Aktifkan"}
                    </button>
                </form>
            </div>
        </div>
    );
}
