import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle, Tag } from "lucide-react";
import { api, formatApiErrorDetail, formatRupiah } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ClickSpark from "@/components/magic/ClickSpark";
import { toast } from "sonner";

export default function Checkout() {
    const { items, totals, clear } = useCart();
    const { user } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        notes: "",
    });
    const [voucher, setVoucher] = useState("");
    const [applied, setApplied] = useState(null); // { code, discount }
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (user) {
            setForm((f) => ({
                ...f,
                customer_name: f.customer_name || user.name || "",
                customer_phone: f.customer_phone || user.phone || "",
                customer_address: f.customer_address || user.address || "",
            }));
        }
    }, [user]);

    useEffect(() => {
        if (items.length === 0 && !busy) {
            // don't redirect immediately after clear() on submit
        }
    }, [items, busy]);

    const applyVoucher = async () => {
        if (!voucher.trim()) return;
        try {
            const { data } = await api.post("/discounts/validate", {
                code: voucher.trim(),
                subtotal: totals.subtotal,
            });
            setApplied(data);
            toast.success(`Voucher ${data.code} berhasil dipakai`);
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail));
            setApplied(null);
        }
    };

    const discount = applied?.discount || 0;
    const total = Math.max(0, totals.subtotal - discount);

    const handleCheckout = async () => {
        if (!form.customer_name || !form.customer_phone || !form.customer_address) {
            toast.error("Lengkapi nama, nomor WA, dan alamat.");
            return;
        }
        if (items.length === 0) {
            toast.error("Keranjang kosong.");
            return;
        }
        setBusy(true);
        try {
            // 1. Create order
            const { data: order } = await api.post("/orders", {
                customer_name: form.customer_name,
                customer_phone: form.customer_phone,
                customer_address: form.customer_address,
                notes: form.notes,
                items: items.map((i) => ({
                    product_id: i.product_id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    image: i.image,
                })),
                voucher_code: applied?.code,
            });
            // 2. Build WA url
            const { data: wa } = await api.post("/whatsapp/build", {
                order_number: order.order_number,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address,
                notes: order.notes,
                items: order.items,
                subtotal: order.subtotal,
                discount: order.discount,
                total: order.total,
            });
            clear();
            toast.success(`Order ${order.order_number} dibuat. Membuka WhatsApp...`);
            // 3. Open WhatsApp
            window.open(wa.wa_url, "_blank");
            setTimeout(() => nav("/orders"), 800);
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                <h1 className="font-display text-3xl mb-4">Keranjang kosong</h1>
                <Link to="/products" className="text-brand-200">
                    Belanja dulu →
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
            <h1 className="font-display text-4xl mb-10">Checkout</h1>
            <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                        <h3 className="text-sm tracking-[0.2em] uppercase text-zinc-500 mb-4">
                            Informasi Pengiriman
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={form.customer_name}
                                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                placeholder="Nama lengkap"
                                data-testid="checkout-name"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                            <input
                                type="text"
                                value={form.customer_phone}
                                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                                placeholder="Nomor WhatsApp (mis. 6281xxx)"
                                data-testid="checkout-phone"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                            <textarea
                                value={form.customer_address}
                                onChange={(e) =>
                                    setForm({ ...form, customer_address: e.target.value })
                                }
                                placeholder="Alamat lengkap (jalan, kota, kode pos)"
                                rows={3}
                                data-testid="checkout-address"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Catatan pesanan (opsional)"
                                rows={2}
                                data-testid="checkout-notes"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                        <h3 className="text-sm tracking-[0.2em] uppercase text-zinc-500 mb-4">
                            Kode Voucher
                        </h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    value={voucher}
                                    onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                                    placeholder="Masukkan kode"
                                    data-testid="checkout-voucher"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200 uppercase tracking-wider"
                                />
                            </div>
                            <button
                                onClick={applyVoucher}
                                data-testid="checkout-apply-voucher"
                                className="px-6 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                        {applied && (
                            <p className="text-xs text-brand-200 mt-3">
                                Voucher {applied.code} aktif — potongan{" "}
                                {formatRupiah(applied.discount)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 sticky top-24">
                        <h3 className="font-display text-xl mb-6">Ringkasan</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-4">
                            {items.map((i) => (
                                <div key={i.product_id} className="flex gap-3 text-sm">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                                        {i.image ? (
                                            <img
                                                src={i.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="line-clamp-1">{i.name}</p>
                                        <p className="text-zinc-500 text-xs">
                                            {i.quantity} × {formatRupiah(i.price)}
                                        </p>
                                    </div>
                                    <p className="text-brand-200 text-sm">
                                        {formatRupiah(i.price * i.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="h-px bg-white/10 my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-400">
                                <span>Subtotal</span>
                                <span className="text-white">{formatRupiah(totals.subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-brand-200">
                                    <span>Diskon voucher</span>
                                    <span>−{formatRupiah(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-display mt-3 pt-3 border-t border-white/10">
                                <span>Total</span>
                                <span className="text-brand-200">{formatRupiah(total)}</span>
                            </div>
                        </div>
                        <ClickSpark className="block">
                            <button
                                onClick={handleCheckout}
                                disabled={busy}
                                data-testid="checkout-wa-btn"
                                className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-7 py-3.5 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Checkout via WhatsApp
                            </button>
                        </ClickSpark>
                        <p className="text-xs text-zinc-500 mt-3 text-center">
                            WhatsApp akan terbuka dengan pesan otomatis
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
