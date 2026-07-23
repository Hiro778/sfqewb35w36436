import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { api, formatRupiah, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function AdminProducts() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const { data } = await api.get("/admin/products");
        setItems(data);
        setLoading(false);
    };
    useEffect(() => {
        load();
    }, []);

    const del = async (id) => {
        if (!window.confirm("Hapus produk ini?")) return;
        try {
            await api.delete(`/admin/products/${id}`);
            toast.success("Produk dihapus");
            load();
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail));
        }
    };

    const filtered = items.filter(
        (p) =>
            !q ||
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            (p.sku || "").toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-3xl">Produk</h1>
                    <p className="text-sm text-zinc-400">{items.length} total produk</p>
                </div>
                <Link
                    to="/admin/products/new"
                    data-testid="admin-add-product-btn"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-5 py-2.5 font-medium text-sm hover:bg-brand-300 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tambah Produk
                </Link>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari nama atau SKU..."
                    data-testid="admin-products-search"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Harga</th>
                                <th className="px-4 py-3">Stok</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-zinc-500">
                                        Memuat...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-zinc-500">
                                        Belum ada produk. Tambahkan yang pertama.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    data-testid={`admin-product-row-${p.id}`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                                                {p.images?.[0] ? (
                                                    <img
                                                        src={p.images[0]}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full grid place-items-center text-zinc-700">
                                                        —
                                                    </div>
                                                )}
                                            </div>
                                            <span className="line-clamp-1">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono-alt text-xs text-zinc-400">
                                        {p.sku || "—"}
                                    </td>
                                    <td className="px-4 py-3">{formatRupiah(p.price)}</td>
                                    <td
                                        className={`px-4 py-3 ${
                                            p.stock <= 5 ? "text-amber-400" : ""
                                        }`}
                                    >
                                        {p.stock}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${
                                                p.is_active
                                                    ? "bg-emerald-500/20 text-emerald-300"
                                                    : "bg-zinc-500/20 text-zinc-400"
                                            }`}
                                        >
                                            {p.is_active ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <Link
                                                to={`/admin/products/${p.id}/edit`}
                                                data-testid={`admin-edit-product-${p.id}`}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => del(p.id)}
                                                data-testid={`admin-delete-product-${p.id}`}
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
        </div>
    );
}
