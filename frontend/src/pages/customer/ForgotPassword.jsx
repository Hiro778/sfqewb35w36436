import { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
                <h1 className="font-display text-3xl mb-2">Lupa Password</h1>
                <p className="text-sm text-zinc-400 mb-6">
                    Masukkan email Anda. Jika terdaftar, tautan reset akan dikirim.
                </p>
                {sent ? (
                    <p className="text-brand-200 text-sm">
                        Jika email terdaftar, cek email untuk tautan reset password (untuk demo, cek
                        log server).
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <input
                            required
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            data-testid="forgot-email"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="forgot-submit"
                            className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors"
                        >
                            Kirim Link Reset
                        </button>
                    </form>
                )}
                <Link
                    to="/login"
                    className="block text-center text-sm text-zinc-400 mt-6 hover:text-brand-200"
                >
                    Kembali ke Login
                </Link>
            </div>
        </div>
    );
}
