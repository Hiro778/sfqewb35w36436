import { useState, useEffect } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({ name: "", phone: "", address: "" });
    const [pwd, setPwd] = useState({ current_password: "", new_password: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "" });
        }
    }, [user]);

    const saveProfile = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.put("/auth/profile", form);
            updateUser(data);
            toast.success("Profil tersimpan");
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    const changePwd = async (e) => {
        e.preventDefault();
        try {
            await api.put("/auth/change-password", pwd);
            toast.success("Password berhasil diubah");
            setPwd({ current_password: "", new_password: "" });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
            <h1 className="font-display text-4xl mb-8">Profil Saya</h1>
            <div className="space-y-6">
                <form
                    onSubmit={saveProfile}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6"
                >
                    <h3 className="text-sm tracking-[0.2em] uppercase text-zinc-500 mb-4">
                        Info Personal
                    </h3>
                    <div className="space-y-3">
                        <input
                            placeholder="Nama"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            data-testid="profile-name"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-500 cursor-not-allowed"
                        />
                        <input
                            placeholder="No WhatsApp"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            data-testid="profile-phone"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <textarea
                            placeholder="Alamat default (opsional)"
                            rows={3}
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            data-testid="profile-address"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        data-testid="profile-save"
                        className="mt-4 rounded-full bg-brand-200 text-zinc-950 px-6 py-2.5 text-sm font-medium hover:bg-brand-300 transition-colors"
                    >
                        Simpan Perubahan
                    </button>
                </form>

                <form
                    onSubmit={changePwd}
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6"
                >
                    <h3 className="text-sm tracking-[0.2em] uppercase text-zinc-500 mb-4">
                        Ganti Password
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="password"
                            required
                            placeholder="Password lama"
                            value={pwd.current_password}
                            onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                            data-testid="profile-current-pwd"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Password baru"
                            value={pwd.new_password}
                            onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                            data-testid="profile-new-pwd"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </div>
                    <button
                        type="submit"
                        data-testid="profile-change-pwd"
                        className="mt-4 rounded-full border border-white/10 text-zinc-100 px-6 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    >
                        Ubah Password
                    </button>
                </form>
            </div>
        </div>
    );
}
