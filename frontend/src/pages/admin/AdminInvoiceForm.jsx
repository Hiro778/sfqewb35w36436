import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { api, formatRupiah, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const EMPTY_ITEM = { product_id: "", name: "", price: 0, quantity: 1, image: "" };

export default function AdminInvoiceForm() {
    const { id } = useParams();
    const location = useLocation();
    const isEdit = !!id;
    const nav = useNavigate();
    const [form, setForm] = useState({
        order_id: null,
        customer_name: "",
        customer_phone: "",
        items: [{ ...EMPTY_ITEM }],
        discount: 0,
        tax: 0,
        payment_status: "pending",
        notes: "",
    });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.get(`/admin/invoices/${id}`).then(({ data }) => {
                setForm({
                    order_id: data.order_id,
                    customer_name: data.customer_name,
                    customer_phone: data.customer_phone,
                    items: data.items,
                    discount: data.discount,
                    tax: data.tax,
                    payment_status: data.payment_status,
                    notes: data.notes || "",
                });
            });
        } else if (location.state?.order) {
            const o = location.state.order;
            setForm({
                order_id: o.id,
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                items: o.items,
                discount: o.discount || 0,
                tax: 0,
                payment_status: "pending",
                notes: o.notes || "",
            });
        }
        // eslint-disable-next-line
    }, [id]);

    const subtotal = form.items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    const grand = Math.max(0, subtotal - Number(form.discount) + Number(form.tax));

    const updateItem = (idx, key, val) => {
        setForm((f) => {
            const items = [...f.items];
            items[idx] = { ...items[idx], [key]: val };
            return { ...f, items };
        });
    };
    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
    const removeItem = (idx) =>
        setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        const payload = {
            ...form,
            discount: Number(form.discount),
            tax: Number(form.tax),
            items: form.items.map((i) => ({
                ...i,
                price: Number(i.price),
                quantity: Number(i.quantity),
            })),
        };
        try {
            if (isEdit) {
                await api.put(`/admin/invoices/${id}`, payload);
                toast.success("Invoice diperbarui");
            } else {
                await api.post("/admin/invoices", payload);
                toast.success("Invoice dibuat");
            }
            nav("/admin/invoices");
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <Link
                to="/admin/invoices"
                className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-brand-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" /> Kembali
            </Link>
            <h1 className="font-display text-3xl mb-8">
                {isEdit ? "Edit Invoice" : "Invoice Baru"}
            </h1>
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
                        Customer
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        <input
                            required
                            placeholder="Nama customer"
                            value={form.customer_name}
                            onChange={(e) =>
                                setForm({ ...form, customer_name: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <input
                            required
                            placeholder="No WhatsApp (mis. 6281xxx)"
                            value={form.customer_phone}
                            onChange={(e) =>
                                setForm({ ...form, customer_phone: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-xs text-brand-200 hover:underline inline-flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Tambah item
                        </button>
                    </div>
                    <div className="space-y-2">
                        {form.items.map((it, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    placeholder="Nama produk"
                                    value={it.name}
                                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                                    className="col-span-5 px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-sm"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Harga"
                                    value={it.price}
                                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                                    className="col-span-3 px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-sm"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Qty"
                                    value={it.quantity}
                                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                    className="col-span-2 px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-sm"
                                />
                                <div className="col-span-1 text-right text-xs text-zinc-400">
                                    {formatRupiah(Number(it.price) * Number(it.quantity))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className="col-span-1 p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
                        Ringkasan
                    </h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Diskon (Rp)</label>
                            <input
                                type="number"
                                min="0"
                                value={form.discount}
                                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Pajak (Rp)</label>
                            <input
                                type="number"
                                min="0"
                                value={form.tax}
                                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                            <select
                                value={form.payment_status}
                                onChange={(e) =>
                                    setForm({ ...form, payment_status: e.target.value })
                                }
                                className="w-full px-4 py-2 rounded-xl bg-zinc-950 border border-white/10"
                            >
                                <option value="pending">pending</option>
                                <option value="paid">paid</option>
                                <option value="cancelled">cancelled</option>
                                <option value="refund">refund</option>
                            </select>
                        </div>
                    </div>
                    <textarea
                        rows={2}
                        placeholder="Catatan (opsional)"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full mt-3 px-4 py-3 rounded-xl bg-zinc-950 border border-white/10"
                    />
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Diskon</span>
                            <span>−{formatRupiah(form.discount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Pajak</span>
                            <span>{formatRupiah(form.tax || 0)}</span>
                        </div>
                        <div className="flex justify-between font-display text-lg pt-2 border-t border-white/10">
                            <span>Grand Total</span>
                            <span className="text-brand-200">{formatRupiah(grand)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => nav("/admin/invoices")}
                        className="rounded-full px-6 py-2.5 text-sm border border-white/10 hover:bg-white/5"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        data-testid="invoice-form-save"
                        className="rounded-full bg-brand-200 text-zinc-950 px-6 py-2.5 text-sm font-medium hover:bg-brand-300 disabled:opacity-40"
                    >
                        {busy ? "Menyimpan..." : "Simpan Invoice"}
                    </button>
                </div>
            </form>
        </div>
    );
}
