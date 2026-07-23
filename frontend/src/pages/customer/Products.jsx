import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import ProductCard from "@/components/customer/ProductCard";

const SORTS = [
    { v: "newest", l: "Terbaru" },
    { v: "popular", l: "Terpopuler" },
    { v: "price-asc", l: "Harga: rendah → tinggi" },
    { v: "price-desc", l: "Harga: tinggi → rendah" },
];

export default function Products() {
    const [sp, setSp] = useSearchParams();
    const [cats, setCats] = useState([]);
    const [items, setItems] = useState([]);
    const [q, setQ] = useState(sp.get("q") || "");
    const [debouncedQ, setDebouncedQ] = useState(sp.get("q") || "");
    const [loading, setLoading] = useState(true);

    const activeCat = sp.get("category") || "";
    const activeSort = sp.get("sort") || "newest";
    const onSale = sp.get("sale") === "1";

    useEffect(() => {
        api.get("/categories").then(({ data }) => setCats(data));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (debouncedQ) params.q = debouncedQ;
        if (activeCat) params.category = activeCat;
        if (activeSort) params.sort = activeSort;
        if (onSale) params.on_sale = 1;
        api.get("/products", { params }).then(({ data }) => {
            setItems(data);
            setLoading(false);
        });
    }, [debouncedQ, activeCat, activeSort, onSale]);

    const setParam = (k, v) => {
        const nsp = new URLSearchParams(sp);
        if (v == null || v === "") nsp.delete(k);
        else nsp.set(k, v);
        setSp(nsp);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
            <div className="mb-10">
                <h1 className="font-display text-4xl sm:text-5xl">All Products</h1>
                <p className="text-zinc-400 mt-2">
                    {items.length} produk {activeCat && "dalam kategori terpilih"}
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari produk..."
                        data-testid="products-search"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm focus:ring-2 focus:ring-brand-200 focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={activeSort}
                    onChange={(e) => setParam("sort", e.target.value)}
                    data-testid="products-sort"
                    className="rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                >
                    {SORTS.map((s) => (
                        <option key={s.v} value={s.v}>
                            {s.l}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-2 flex-wrap mb-8">
                <button
                    onClick={() => setParam("category", "")}
                    data-testid="filter-cat-all"
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        !activeCat
                            ? "bg-brand-200 text-zinc-950 border-brand-200"
                            : "border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                >
                    Semua
                </button>
                {cats.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setParam("category", c.id)}
                        data-testid={`filter-cat-${c.slug}`}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            activeCat === c.id
                                ? "bg-brand-200 text-zinc-950 border-brand-200"
                                : "border-white/10 text-zinc-300 hover:bg-white/5"
                        }`}
                    >
                        {c.name}
                    </button>
                ))}
                <button
                    onClick={() => setParam("sale", onSale ? "" : "1")}
                    data-testid="filter-sale"
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        onSale
                            ? "bg-red-500 text-white border-red-500"
                            : "border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                >
                    Sale
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-2xl bg-zinc-900/60 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-24 text-zinc-500">
                    <p className="font-display text-2xl mb-2">Belum ada produk</p>
                    <p className="text-sm">Coba filter lain atau cek kembali nanti.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {items.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
