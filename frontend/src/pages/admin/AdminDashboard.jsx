import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import {
    ShoppingBag,
    Package,
    Users,
    TrendingUp,
    Percent,
    Boxes,
    AlertTriangle,
} from "lucide-react";
import { api, formatRupiah } from "@/lib/api";

const RANGES = [
    { v: "14d", l: "14 hari" },
    { v: "30d", l: "30 hari" },
    { v: "12m", l: "12 bulan" },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [range, setRange] = useState("14d");

    useEffect(() => {
        api.get("/admin/dashboard").then(({ data }) => setStats(data));
    }, []);

    if (!stats) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 animate-pulse" />
                ))}
            </div>
        );
    }

    const chartData = stats[`chart_${range}`];

    const cards = [
        { label: "Revenue hari ini", value: formatRupiah(stats.revenue.today), Icon: TrendingUp },
        { label: "Revenue minggu ini", value: formatRupiah(stats.revenue.week), Icon: TrendingUp },
        { label: "Revenue bulan ini", value: formatRupiah(stats.revenue.month), Icon: TrendingUp },
        { label: "Revenue tahun ini", value: formatRupiah(stats.revenue.year), Icon: TrendingUp },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl">Dashboard</h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Ringkasan performa Hazze'On Commerce.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
                        data-testid={`dashboard-card-${i}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs tracking-[0.15em] uppercase text-zinc-500">
                                {c.label}
                            </p>
                            <c.Icon className="w-4 h-4 text-brand-200" />
                        </div>
                        <p className="font-display text-2xl">{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <ShoppingBag className="w-4 h-4" />
                        <p className="text-xs tracking-[0.15em] uppercase">Orders</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                            <p className="text-xs text-zinc-500">Pending</p>
                            <p className="font-display text-xl text-amber-400">
                                {stats.orders.pending}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Selesai</p>
                            <p className="font-display text-xl text-emerald-400">
                                {stats.orders.completed}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Batal</p>
                            <p className="font-display text-xl text-red-400">
                                {stats.orders.cancelled}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <Users className="w-4 h-4" />
                        <p className="text-xs tracking-[0.15em] uppercase">Customers</p>
                    </div>
                    <p className="font-display text-3xl mt-3">{stats.totals.customers}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                        <Package className="w-4 h-4" />
                        <p className="text-xs tracking-[0.15em] uppercase">Products</p>
                    </div>
                    <p className="font-display text-3xl mt-3">{stats.totals.products}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs tracking-[0.15em] uppercase text-zinc-500">
                            Revenue Chart
                        </p>
                        <h3 className="font-display text-xl mt-1">Pendapatan</h3>
                    </div>
                    <div className="flex gap-1 rounded-full border border-white/10 bg-zinc-950 p-1">
                        {RANGES.map((r) => (
                            <button
                                key={r.v}
                                onClick={() => setRange(r.v)}
                                data-testid={`chart-range-${r.v}`}
                                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                                    range === r.v
                                        ? "bg-brand-200 text-zinc-950"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {r.l}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-72" style={{ minHeight: 288 }}>
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e4d3b5" stopOpacity={0.6} />
                                    <stop offset="100%" stopColor="#e4d3b5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                            <YAxis
                                stroke="#71717a"
                                fontSize={11}
                                tickFormatter={(v) =>
                                    v >= 1000000
                                        ? `${(v / 1000000).toFixed(1)}jt`
                                        : v >= 1000
                                          ? `${v / 1000}k`
                                          : v
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#09090b",
                                    border: "1px solid #27272a",
                                    borderRadius: 12,
                                }}
                                formatter={(v) => [formatRupiah(v), "Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#e4d3b5"
                                fill="url(#rev)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* Recent orders */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs tracking-[0.15em] uppercase text-zinc-500">
                            Order Terbaru
                        </p>
                        <Link
                            to="/admin/orders"
                            className="text-xs text-brand-200 hover:underline"
                        >
                            Lihat semua →
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {stats.recent_orders.length === 0 && (
                            <p className="text-sm text-zinc-500">Belum ada order.</p>
                        )}
                        {stats.recent_orders.slice(0, 6).map((o) => (
                            <div
                                key={o.id}
                                className="flex items-center justify-between text-sm border-b border-white/5 pb-2"
                            >
                                <div>
                                    <p className="font-mono-alt text-xs">{o.order_number}</p>
                                    <p className="text-zinc-500 text-xs">{o.customer_name}</p>
                                </div>
                                <p className="text-brand-200">{formatRupiah(o.total)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Best sellers */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 mb-4">
                        Produk Terlaris
                    </p>
                    <div className="space-y-2">
                        {stats.best_selling.length === 0 && (
                            <p className="text-sm text-zinc-500">Belum ada penjualan.</p>
                        )}
                        {stats.best_selling.slice(0, 6).map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between text-sm border-b border-white/5 pb-2"
                            >
                                <p className="line-clamp-1">{p.name}</p>
                                <p className="text-zinc-500 text-xs">terjual: {p.sold_count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low stock alerts */}
            {stats.low_stock.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="text-sm font-medium">Stok menipis</p>
                    </div>
                    <div className="space-y-1">
                        {stats.low_stock.map((p) => (
                            <div key={p.id} className="text-sm flex justify-between">
                                <span>{p.name}</span>
                                <span className="text-amber-400">stok: {p.stock}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
