import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";

export default function InvoicePrint() {
    const { id } = useParams();
    const [inv, setInv] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        api.get(`/invoices/${id}/public`).then(({ data }) => {
            setInv(data.invoice);
            setSettings(data.settings);
            setTimeout(() => window.print(), 400);
        });
    }, [id]);

    if (!inv || !settings) return <div className="p-8">Loading invoice...</div>;

    return (
        <div className="print-page min-h-screen bg-white text-neutral-900 py-10 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            {settings.logo ? (
                                <img
                                    src={settings.logo}
                                    alt="logo"
                                    className="w-12 h-12 object-contain"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-neutral-900 text-white grid place-items-center font-serif text-xl">
                                    H
                                </div>
                            )}
                            <div>
                                <p className="font-serif text-2xl">{settings.business_name}</p>
                                <p className="text-xs text-neutral-500">
                                    {settings.email} · +{settings.whatsapp_number}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 max-w-sm">{settings.address}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-neutral-500">Invoice</p>
                        <p className="font-mono text-lg">{inv.invoice_number}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {new Date(inv.created_at).toLocaleString("id-ID")}
                        </p>
                        <p className="mt-2 text-sm">
                            <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                    inv.payment_status === "paid"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : inv.payment_status === "cancelled"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-amber-100 text-amber-800"
                                }`}
                            >
                                {inv.payment_status}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                            Bill to
                        </p>
                        <p className="font-medium">{inv.customer_name}</p>
                        <p className="text-sm text-neutral-600">+{inv.customer_phone}</p>
                    </div>
                </div>

                <table className="w-full mt-8 text-sm">
                    <thead>
                        <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-widest text-neutral-500">
                            <th className="py-2">Produk</th>
                            <th className="py-2 text-right">Qty</th>
                            <th className="py-2 text-right">Harga</th>
                            <th className="py-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inv.items.map((it, i) => (
                            <tr key={i} className="border-b border-neutral-100">
                                <td className="py-2">{it.name}</td>
                                <td className="py-2 text-right">{it.quantity}</td>
                                <td className="py-2 text-right">{formatRupiah(it.price)}</td>
                                <td className="py-2 text-right">
                                    {formatRupiah(it.price * it.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mt-6">
                    <div className="w-64 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Subtotal</span>
                            <span>{formatRupiah(inv.subtotal)}</span>
                        </div>
                        {inv.discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Diskon</span>
                                <span>−{formatRupiah(inv.discount)}</span>
                            </div>
                        )}
                        {inv.tax > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Pajak</span>
                                <span>{formatRupiah(inv.tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-neutral-200 font-medium text-base">
                            <span>Grand Total</span>
                            <span>{formatRupiah(inv.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {inv.notes && (
                    <div className="mt-8 text-sm">
                        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                            Catatan
                        </p>
                        <p>{inv.notes}</p>
                    </div>
                )}

                <p className="text-center text-xs text-neutral-400 mt-16">
                    Terima kasih atas pembelian Anda.
                </p>

                <div className="no-print mt-8 text-center">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 rounded-full bg-neutral-900 text-white text-sm"
                    >
                        Print / Save as PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
