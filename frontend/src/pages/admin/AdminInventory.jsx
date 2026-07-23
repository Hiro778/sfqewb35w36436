import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { api, formatRupiah } from "@/lib/api";

export default function AdminInventory() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/admin/products").then(({ data }) => setItems(data));
    }, []);

    const low = items.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const rest = items.filter((p) => p.stock > 5).sort((a, b) => a.stock - b.stock);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl">Inventory</h1>
                <p className="text-sm text-zinc-400">Pantau stok produk & alert stok menipis.</p>
            </div>

            {low.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="text-sm font-medium">Stok menipis ({low.length})</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                        {low.map((p) => (
                            <Link
                                key={p.id}
                                to={`/admin/products/${p.id}/edit`}
                                className="flex justify-between text-sm bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30 transition-colors"
                            >
                                <span className="line-clamp-1">{p.name}</span>
                                <span className="text-amber-400">stok: {p.stock}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Harga</th>
                                <th className="px-4 py-3">Terjual</th>
                                <th className="px-4 py-3">Stok</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rest.map((p) => (
                                <tr key={p.id} className="border-b border-white/5">
                                    <td className="px-4 py-3">{p.name}</td>
                                    <td className="px-4 py-3 font-mono-alt text-xs text-zinc-400">
                                        {p.sku || "—"}
                                    </td>
                                    <td className="px-4 py-3">{formatRupiah(p.price)}</td>
                                    <td className="px-4 py-3 text-zinc-400">{p.sold_count || 0}</td>
                                    <td className="px-4 py-3">{p.stock}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-zinc-500">
                                        Belum ada produk.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
