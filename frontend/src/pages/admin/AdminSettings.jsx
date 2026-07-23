import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export default function AdminSettings() {
    const { settings, refresh } = useSettings();
    const [form, setForm] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (settings) setForm({ ...settings });
    }, [settings]);

    if (!form) return <div className="text-zinc-500">Memuat pengaturan...</div>;

    const handleLogo = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 500 * 1024) {
            toast.error("Logo maks 500KB");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setForm({ ...form, logo: reader.result });
        reader.readAsDataURL(file);
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                ...form,
                tax_rate: Number(form.tax_rate) || 0,
            };
            await api.put("/admin/settings", payload);
            await refresh();
            toast.success("Pengaturan tersimpan");
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <h1 className="font-display text-3xl mb-8">Pengaturan</h1>
            <form onSubmit={save} className="space-y-4">
                {/* Business */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500">Business</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Nama Bisnis</label>
                            <input
                                value={form.business_name || ""}
                                onChange={(e) =>
                                    setForm({ ...form, business_name: e.target.value })
                                }
                                data-testid="settings-business-name"
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Email</label>
                            <input
                                type="email"
                                value={form.email || ""}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">
                                WhatsApp Number (mis. 6288xxx)
                            </label>
                            <input
                                value={form.whatsapp_number || ""}
                                onChange={(e) =>
                                    setForm({ ...form, whatsapp_number: e.target.value })
                                }
                                data-testid="settings-wa"
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Currency</label>
                            <input
                                value={form.currency || "IDR"}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Alamat</label>
                        <textarea
                            rows={2}
                            value={form.address || ""}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Logo</label>
                        <div className="flex items-center gap-3">
                            {form.logo && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 relative">
                                    <img
                                        src={form.logo}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, logo: "" })}
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 grid place-items-center text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <label className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/20 px-4 py-2 text-sm cursor-pointer hover:bg-white/5">
                                <Upload className="w-4 h-4" />
                                Upload logo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogo}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Social */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500">
                        Social Media
                    </h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <input
                            placeholder="Instagram URL"
                            value={form.instagram || ""}
                            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <input
                            placeholder="Facebook URL"
                            value={form.facebook || ""}
                            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <input
                            placeholder="TikTok URL"
                            value={form.tiktok || ""}
                            onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                        />
                    </div>
                </div>

                {/* Tax */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500">Pajak</h3>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">
                            Persentase pajak (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.tax_rate || 0}
                            onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                            className="w-full max-w-xs px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                        />
                    </div>
                </div>

                {/* WA Template */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500">
                        Template Pesan WhatsApp
                    </h3>
                    <p className="text-xs text-zinc-500">
                        Placeholder yang tersedia:{" "}
                        <span className="font-mono-alt text-brand-200">
                            {"{business_name}"} {"{customer_name}"} {"{customer_phone}"}{" "}
                            {"{customer_address}"} {"{order_number}"} {"{product_list}"}{" "}
                            {"{subtotal}"} {"{discount}"} {"{total}"} {"{notes}"}
                        </span>
                    </p>
                    <textarea
                        rows={12}
                        value={form.wa_message_template || ""}
                        onChange={(e) =>
                            setForm({ ...form, wa_message_template: e.target.value })
                        }
                        data-testid="settings-wa-template"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 font-mono-alt text-xs"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={busy}
                        data-testid="settings-save"
                        className="rounded-full bg-brand-200 text-zinc-950 px-6 py-2.5 text-sm font-medium hover:bg-brand-300 disabled:opacity-40"
                    >
                        {busy ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                </div>
            </form>
        </div>
    );
}
