import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminCustomers() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/admin/customers").then(({ data }) => setItems(data));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl">Customer</h1>
                <p className="text-sm text-zinc-400">{items.length} customer terdaftar</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">HP</th>
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Terdaftar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-zinc-500">
                                        Belum ada customer.
                                    </td>
                                </tr>
                            )}
                            {items.map((c) => (
                                <tr key={c.id} className="border-b border-white/5">
                                    <td className="px-4 py-3">{c.name}</td>
                                    <td className="px-4 py-3 text-zinc-400">{c.email}</td>
                                    <td className="px-4 py-3 text-zinc-400">{c.phone || "—"}</td>
                                    <td className="px-4 py-3">{c.order_count}</td>
                                    <td className="px-4 py-3 text-zinc-500 text-xs">
                                        {new Date(c.created_at).toLocaleDateString("id-ID")}
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
