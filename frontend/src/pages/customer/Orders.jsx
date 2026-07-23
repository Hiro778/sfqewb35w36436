import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import { Package } from "lucide-react";

const STATUS_BADGES = {
    pending: "bg-amber-500/20 text-amber-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/orders/my")
            .then(({ data }) => setOrders(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
            <h1 className="font-display text-4xl mb-8">Riwayat Pesanan</h1>
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-zinc-900/60 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Belum ada pesanan.</p>
                    <Link to="/products" className="text-brand-200 text-sm mt-2 inline-block">
                        Belanja sekarang
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((o) => (
                        <div
                            key={o.id}
                            data-testid={`order-${o.order_number}`}
                            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-zinc-500">Order</p>
                                    <p className="font-mono-alt text-sm">{o.order_number}</p>
                                </div>
                                <span
                                    className={`text-xs px-2.5 py-1 rounded-full ${STATUS_BADGES[o.status]}`}
                                >
                                    {o.status}
                                </span>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                {o.items.map((it, i) => (
                                    <div key={i} className="flex justify-between text-zinc-300">
                                        <span className="line-clamp-1">
                                            {it.name} × {it.quantity}
                                        </span>
                                        <span>{formatRupiah(it.price * it.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-zinc-500">
                                    {new Date(o.created_at).toLocaleString("id-ID")}
                                </p>
                                <p className="font-display text-lg text-brand-200">
                                    {formatRupiah(o.total)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
