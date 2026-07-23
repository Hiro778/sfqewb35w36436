import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatRupiah, getFileUrl } from "@/lib/api";
import ClickSpark from "@/components/magic/ClickSpark";

export default function Cart() {
    const { items, updateQty, remove, totals } = useCart();

    if (items.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 grid place-items-center mx-auto mb-6">
                    <ShoppingBag className="w-6 h-6 text-zinc-500" />
                </div>
                <h1 className="font-display text-3xl mb-3">Keranjang masih kosong</h1>
                <p className="text-zinc-400 mb-8">Yuk pilih produk favoritmu dulu.</p>
                <Link
                    to="/products"
                    className="inline-block rounded-full bg-brand-200 text-zinc-950 px-7 py-3 font-medium hover:bg-brand-300 transition-colors"
                >
                    Belanja sekarang
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
            <h1 className="font-display text-4xl mb-10">Your Cart</h1>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {items.map((it) => (
                        <div
                            key={it.product_id}
                            data-testid={`cart-item-${it.product_id}`}
                            className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4"
                        >
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0">
                                {it.image ? (
                                    <img src={getFileUrl(it.image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full grid place-items-center text-zinc-700 font-display text-2xl">
                                        {it.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/products/${it.slug || it.product_id}`}
                                    className="text-sm font-medium hover:text-brand-200 transition-colors line-clamp-1"
                                >
                                    {it.name}
                                </Link>
                                <p className="text-brand-200 mt-1 text-sm">{formatRupiah(it.price)}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900 overflow-hidden">
                                        <button
                                            onClick={() => updateQty(it.product_id, it.quantity - 1)}
                                            className="p-1.5 hover:bg-white/5"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-3 text-sm min-w-[2ch] text-center">
                                            {it.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQty(it.product_id, it.quantity + 1)}
                                            className="p-1.5 hover:bg-white/5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-between">
                                <button
                                    onClick={() => remove(it.product_id)}
                                    data-testid={`cart-remove-${it.product_id}`}
                                    className="text-zinc-500 hover:text-red-400 self-end"
                                    aria-label="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <p className="text-sm font-medium">
                                    {formatRupiah(it.price * it.quantity)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 h-fit sticky top-24">
                    <h3 className="font-display text-xl mb-6">Ringkasan</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Subtotal ({totals.count} item)</span>
                            <span className="text-white">{formatRupiah(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>Ongkir</span>
                            <span>Ditentukan via WA</span>
                        </div>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between text-lg font-display">
                        <span>Total</span>
                        <span className="text-brand-200">{formatRupiah(totals.subtotal)}</span>
                    </div>
                    <Link to="/checkout" data-testid="cart-checkout-btn">
                        <ClickSpark className="block">
                            <div className="mt-6 w-full text-center rounded-full bg-brand-200 text-zinc-950 px-7 py-3 font-medium hover:bg-brand-300 transition-colors">
                                Lanjut ke Checkout
                            </div>
                        </ClickSpark>
                    </Link>
                    <p className="text-xs text-zinc-500 mt-3 text-center">
                        Pembayaran dikonfirmasi manual via WhatsApp
                    </p>
                </div>
            </div>
        </div>
    );
}
