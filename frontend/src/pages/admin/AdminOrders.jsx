import { useEffect, useState } from "react";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { api, formatRupiah, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const STATUS_COLORS = {
    pending: "bg-amber-500/20 text-amber-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
};

export default function AdminOrders() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all");
    const nav = useNavigate();

    const load = () => api.get("/admin/orders").then(({ data }) => setItems(data));
    useEffect(() => {
        load();
    }, []);

    const changeStatus = async (id, status) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { status });
            toast.success("Status diperbarui");
            load();
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail));
        }
    };

    const del = async (id) => {
        if (!window.confirm("Hapus order?")) return;
        await api.delete(`/admin/orders/${id}`);
        toast.success("Order dihapus");
        load();
    };

    const createInvoice = (o) => {
        // Navigate to invoice form pre-filled from order
        nav("/admin/invoices/new", { state: { order: o } });
    };

    const filtered = items.filter((o) => filter === "all" || o.status === filter);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl">Order</h1>
                <p className="text-sm text-zinc-400">{items.length} total pesanan</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {["all", "pending", "completed", "cancelled"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        data-testid={`orders-filter-${s}`}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            filter === s
                                ? "bg-brand-200 text-zinc-950 border-brand-200"
                                : "border-white/10 text-zinc-300 hover:bg-white/5"
                        }`}
                    >
                        {s === "all" ? "Semua" : s}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-8">Belum ada order.</p>
                )}
                {filtered.map((o) => (
                    <div
                        key={o.id}
                        data-testid={`admin-order-${o.order_number}`}
                        className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-mono-alt text-sm text-brand-200">
                                    {o.order_number}
                                </p>
                                <p className="text-sm mt-1">
                                    {o.customer_name} · +{o.customer_phone}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {new Date(o.created_at).toLocaleString("id-ID")}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}
                                >
                                    {o.status}
                                </span>
                                <p className="font-display text-lg text-brand-200">
                                    {formatRupiah(o.total)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-zinc-300">
                            {o.items.map((it, i) => (
                                <div key={i} className="flex justify-between">
                                    <span className="line-clamp-1">
                                        {it.name} × {it.quantity}
                                    </span>
                                    <span>{formatRupiah(it.price * it.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        {o.notes && (
                            <p className="text-xs text-zinc-500 mt-3 border-t border-white/5 pt-3">
                                Catatan: {o.notes}
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <select
                                value={o.status}
                                onChange={(e) => changeStatus(o.id, e.target.value)}
                                className="text-xs bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5"
                            >
                                <option value="pending">pending</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                            </select>
                            {!o.invoice_id ? (
                                <button
                                    onClick={() => createInvoice(o)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-200 text-zinc-950 font-medium hover:bg-brand-300"
                                >
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    Buat Invoice
                                </button>
                            ) : (
                                <Link
                                    to={`/admin/invoices/${o.invoice_id}/edit`}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
                                >
                                    <ExternalLink className="w-3 h-3 inline mr-1" />
                                    Lihat Invoice
                                </Link>
                            )}
                            <button
                                onClick={() => del(o.id)}
                                className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3 h-3 inline mr-1" />
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
