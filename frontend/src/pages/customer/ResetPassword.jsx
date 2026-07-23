import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPassword() {
    const [sp] = useSearchParams();
    const token = sp.get("token") || "";
    const nav = useNavigate();
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error("Token tidak ada");
            return;
        }
        setBusy(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            toast.success("Password berhasil diubah. Silakan login.");
            nav("/login", { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-8">
                <h1 className="font-display text-3xl mb-2">Reset Password</h1>
                <p className="text-sm text-zinc-400 mb-6">Buat password baru untuk akun Anda.</p>
                {!token && (
                    <p className="text-sm text-red-400">
                        Token tidak valid. Silakan minta link baru di{" "}
                        <Link to="/forgot-password" className="underline">
                            halaman lupa password
                        </Link>
                        .
                    </p>
                )}
                {token && (
                    <form onSubmit={submit} className="space-y-3">
                        <input
                            required
                            type="password"
                            minLength={6}
                            placeholder="Password baru (min 6 karakter)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            data-testid="reset-password-input"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="reset-password-submit"
                            className="w-full rounded-full bg-brand-200 text-zinc-950 py-3 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40"
                        >
                            {busy ? "Menyimpan..." : "Ubah Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
