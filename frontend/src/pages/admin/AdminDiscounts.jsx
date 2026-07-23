import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { toast } from "sonner";

const EMPTY = {
    code: "",
    description: "",
    discount_type: "percentage",
    value: 0,
    expiry_date: "",
    usage_limit: 0,
    min_purchase: 0,
    is_active: true,
};

export default function AdminDiscounts() {
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);

    const load = () => api.get("/admin/discounts").then(({ data }) => setItems(data));
    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY);
        setShowForm(true);
    };
    const openEdit = (d) => {
        setEditing(d);
        setForm({ ...d, expiry_date: d.expiry_date ? d.expiry_date.slice(0, 10) : "" });
        setShowForm(true);
    };
    const save = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            value: Number(form.value),
            usage_limit: Number(form.usage_limit),
            min_purchase: Number(form.min_purchase),
            expiry_date: form.expiry_date
                ? new Date(form.expiry_date + "T23:59:59Z").toISOString()
                : null,
        };
        try {
            if (editing) await api.put(`/admin/discounts/${editing.id}`, payload);
            else await api.post("/admin/discounts", payload);
            toast.success("Diskon tersimpan");
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        }
    };
    const del = async (id) => {
        if (!window.confirm("Hapus voucher ini?")) return;
        await api.delete(`/admin/discounts/${id}`);
        toast.success("Terhapus");
        load();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl">Diskon & Voucher</h1>
                    <p className="text-sm text-zinc-400">Kelola kode promo</p>
                </div>
                <button
                    onClick={openNew}
                    data-testid="admin-add-discount-btn"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-5 py-2.5 font-medium text-sm hover:bg-brand-300"
                >
                    <Plus className="w-4 h-4" /> Voucher Baru
                </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Kode</th>
                                <th className="px-4 py-3">Tipe</th>
                                <th className="px-4 py-3">Nilai</th>
                                <th className="px-4 py-3">Min. Beli</th>
                                <th className="px-4 py-3">Terpakai</th>
                                <th className="px-4 py-3">Berakhir</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-zinc-500">
                                        Belum ada voucher.
                                    </td>
                                </tr>
                            )}
                            {items.map((d) => (
                                <tr key={d.id} className="border-b border-white/5">
                                    <td className="px-4 py-3 font-mono-alt text-brand-200">
                                        {d.code}
                                    </td>
                                    <td className="px-4 py-3">
                                        {d.discount_type === "percentage" ? "Persen" : "Nominal"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {d.discount_type === "percentage"
                                            ? `${d.value}%`
                                            : formatRupiah(d.value)}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {d.min_purchase ? formatRupiah(d.min_purchase) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {d.used_count || 0}
                                        {d.usage_limit ? ` / ${d.usage_limit}` : ""}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {d.expiry_date
                                            ? new Date(d.expiry_date).toLocaleDateString("id-ID")
                                            : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <button
                                                onClick={() => openEdit(d)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => del(d.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 grid place-items-center px-4"
                    onClick={() => setShowForm(false)}
                >
                    <form
                        onSubmit={save}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 space-y-3"
                    >
                        <h3 className="font-display text-2xl">
                            {editing ? "Edit Voucher" : "Voucher Baru"}
                        </h3>
                        <input
                            required
                            placeholder="Kode (mis. HAZZE10)"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 uppercase font-mono-alt"
                        />
                        <input
                            placeholder="Deskripsi"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={form.discount_type}
                                onChange={(e) =>
                                    setForm({ ...form, discount_type: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed (Rp)</option>
                            </select>
                            <input
                                type="number"
                                min="0"
                                placeholder="Nilai"
                                value={form.value}
                                onChange={(e) => setForm({ ...form, value: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <input
                            type="number"
                            min="0"
                            placeholder="Minimum pembelian (Rp)"
                            value={form.min_purchase}
                            onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <input
                            type="number"
                            min="0"
                            placeholder="Batas pemakaian (0 = unlimited)"
                            value={form.usage_limit}
                            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <input
                            type="date"
                            value={form.expiry_date}
                            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            />
                            Aktif
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-full px-4 py-2 text-sm border border-white/10"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-brand-200 text-zinc-950 px-4 py-2 text-sm font-medium"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
