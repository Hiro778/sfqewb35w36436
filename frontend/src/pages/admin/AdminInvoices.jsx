import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Printer, MessageCircle, Edit2, Trash2 } from "lucide-react";
import { api, formatRupiah, formatApiErrorDetail, buildWhatsAppUrl } from "@/lib/api";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const PS_COLORS = {
    pending: "bg-amber-500/20 text-amber-300",
    paid: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
    refund: "bg-purple-500/20 text-purple-300",
};

export default function AdminInvoices() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const { settings } = useSettings();

    const load = () =>
        api.get("/admin/invoices", { params: q ? { q } : {} }).then(({ data }) => setItems(data));

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [q]);

    const printInv = (id) => {
        window.open(`/invoice/${id}/print`, "_blank");
    };

    const sendWA = (inv) => {
        const url = window.location.origin + `/invoice/${inv.id}/print`;
        const msg = `Halo *${inv.customer_name}*,\n\nBerikut invoice pesanan Anda:\n\n📄 *${inv.invoice_number}*\nTotal: ${formatRupiah(inv.grand_total)}\nStatus: ${inv.payment_status}\n\nLink invoice: ${url}\n\nTerima kasih! 🙏`;
        const waUrl = buildWhatsAppUrl(inv.customer_phone, msg);
        if (!waUrl) {
            toast.error("Nomor WhatsApp customer tidak valid.");
            return;
        }
        window.open(waUrl, "_blank");
    };

    const del = async (id) => {
        if (!window.confirm("Hapus invoice?")) return;
        await api.delete(`/admin/invoices/${id}`);
        toast.success("Invoice dihapus");
        load();
    };

    const setStatus = async (id, s) => {
        try {
            await api.put(`/admin/invoices/${id}/status`, { payment_status: s });
            toast.success("Status diperbarui");
            load();
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-3xl">Invoice</h1>
                    <p className="text-sm text-zinc-400">{items.length} invoice</p>
                </div>
                <Link
                    to="/admin/invoices/new"
                    data-testid="admin-add-invoice-btn"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-5 py-2.5 font-medium text-sm hover:bg-brand-300"
                >
                    <Plus className="w-4 h-4" /> Invoice Baru
                </Link>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari nomor invoice / nama customer..."
                    data-testid="admin-invoices-search"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">No Invoice</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-zinc-500">
                                        Belum ada invoice.
                                    </td>
                                </tr>
                            )}
                            {items.map((inv) => (
                                <tr key={inv.id} className="border-b border-white/5">
                                    <td className="px-4 py-3 font-mono-alt text-brand-200">
                                        {inv.invoice_number}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p>{inv.customer_name}</p>
                                        <p className="text-xs text-zinc-500">
                                            +{inv.customer_phone}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">{formatRupiah(inv.grand_total)}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={inv.payment_status}
                                            onChange={(e) => setStatus(inv.id, e.target.value)}
                                            className={`text-xs rounded-full px-2 py-0.5 border-0 ${PS_COLORS[inv.payment_status]}`}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="paid">paid</option>
                                            <option value="cancelled">cancelled</option>
                                            <option value="refund">refund</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs">
                                        {new Date(inv.created_at).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-1">
                                            <button
                                                onClick={() => printInv(inv.id)}
                                                data-testid={`admin-invoice-print-${inv.id}`}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                                                title="Print"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => sendWA(inv)}
                                                data-testid={`admin-invoice-wa-${inv.id}`}
                                                className="p-2 rounded-lg hover:bg-white/10 text-emerald-400"
                                                title="Send WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/admin/invoices/${inv.id}/edit`}
                                                data-testid={`admin-invoice-edit-${inv.id}`}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => del(inv.id)}
                                                data-testid={`admin-invoice-delete-${inv.id}`}
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
