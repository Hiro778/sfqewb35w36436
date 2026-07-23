import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, MessageCircle, ChevronLeft } from "lucide-react";
import { api, formatRupiah, computeEffectivePrice, getFileUrl } from "@/lib/api";
import ClickSpark from "@/components/magic/ClickSpark";
import Stack from "@/components/magic/Stack";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";

export default function ProductDetail() {
    const { slug } = useParams();
    const nav = useNavigate();
    const { add } = useCart();
    const { settings } = useSettings();
    const [prod, setProd] = useState(null);
    const [qty, setQty] = useState(1);
    const [activeIdx, setActiveIdx] = useState(0);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setProd(null);
        setNotFound(false);
        api.get(`/products/${slug}`)
            .then(({ data }) => setProd(data))
            .catch(() => setNotFound(true));
    }, [slug]);

    if (notFound) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <p className="font-display text-3xl mb-4">Produk tidak ditemukan</p>
                <Link to="/products" className="text-brand-200">
                    Kembali ke produk
                </Link>
            </div>
        );
    }
    if (!prod) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="aspect-[4/5] bg-zinc-900/60 rounded-2xl animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-6 w-2/3 bg-zinc-900/60 rounded animate-pulse" />
                        <div className="h-8 w-1/3 bg-zinc-900/60 rounded animate-pulse" />
                        <div className="h-32 bg-zinc-900/60 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const effective = computeEffectivePrice(prod);
    const hasDiscount = prod.discount_price && prod.discount_price < prod.price;
    const outOfStock = prod.stock <= 0;
    const images = prod.images && prod.images.length ? prod.images.map(getFileUrl) : [];

    const handleAdd = () => {
        if (outOfStock) return;
        add(prod, qty);
    };

    const buyNow = async () => {
        if (outOfStock) return;
        add(prod, qty);
        nav("/checkout");
    };

    const chatWA = () => {
        if (!settings?.whatsapp_number) return;
        const msg = `Halo, saya tertarik dengan produk *${prod.name}* (${formatRupiah(effective)}). Apakah masih tersedia?`;
        window.open(
            `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
            "_blank"
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-14">
            <button
                onClick={() => nav(-1)}
                className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-brand-200 mb-8 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
                {/* Left — gallery */}
                <div>
                    {images.length >= 3 ? (
                        <div className="flex justify-center">
                            <Stack images={images} cardWidth={480} cardHeight={600} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <motion.div
                                key={activeIdx}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900"
                            >
                                {images[activeIdx] ? (
                                    <img
                                        src={images[activeIdx]}
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full grid place-items-center text-zinc-700 font-display text-6xl">
                                        {prod.name[0]}
                                    </div>
                                )}
                            </motion.div>
                            {images.length > 1 && (
                                <div className="flex gap-2">
                                    {images.map((im, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveIdx(i)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden border ${
                                                activeIdx === i
                                                    ? "border-brand-200"
                                                    : "border-white/10"
                                            }`}
                                        >
                                            <img src={im} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {images.length >= 3 && (
                        <p className="text-center text-xs text-zinc-500 mt-4">
                            Klik gambar untuk melihat foto berikutnya
                        </p>
                    )}
                </div>

                {/* Right — info */}
                <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">Product</p>
                    <h1 className="font-display text-3xl md:text-5xl mt-2" data-testid="product-title">
                        {prod.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="text-3xl font-display text-brand-200">
                            {formatRupiah(effective)}
                        </span>
                        {hasDiscount && (
                            <span className="text-lg text-zinc-500 line-through">
                                {formatRupiah(prod.price)}
                            </span>
                        )}
                        {hasDiscount && (
                            <span className="text-xs rounded-full bg-red-500/20 text-red-400 px-2 py-1">
                                Save {Math.round(((prod.price - prod.discount_price) / prod.price) * 100)}%
                            </span>
                        )}
                    </div>

                    <div className="mt-6">
                        {outOfStock ? (
                            <span className="text-sm text-red-400">Stok habis</span>
                        ) : (
                            <span className="text-sm text-zinc-400">
                                Stok tersedia:{" "}
                                <span className="text-white">{prod.stock}</span>
                            </span>
                        )}
                    </div>

                    <p className="text-zinc-300 leading-relaxed mt-6 whitespace-pre-line">
                        {prod.description || "Deskripsi belum tersedia."}
                    </p>

                    {prod.sku && (
                        <p className="text-xs text-zinc-500 mt-4">SKU: {prod.sku}</p>
                    )}

                    {/* Quantity + Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900 overflow-hidden">
                            <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="p-3 hover:bg-white/5 transition-colors"
                                aria-label="Decrease"
                                data-testid="qty-decrease"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span
                                className="px-4 min-w-[3ch] text-center font-medium"
                                data-testid="qty-value"
                            >
                                {qty}
                            </span>
                            <button
                                onClick={() =>
                                    setQty((q) => (prod.stock ? Math.min(prod.stock, q + 1) : q + 1))
                                }
                                className="p-3 hover:bg-white/5 transition-colors"
                                aria-label="Increase"
                                data-testid="qty-increase"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <ClickSpark>
                            <button
                                disabled={outOfStock}
                                onClick={handleAdd}
                                data-testid="add-to-cart-btn"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-8 py-3.5 font-medium hover:bg-brand-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Add to Cart
                            </button>
                        </ClickSpark>
                        <ClickSpark>
                            <button
                                disabled={outOfStock}
                                onClick={buyNow}
                                data-testid="buy-now-btn"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Buy now
                            </button>
                        </ClickSpark>
                    </div>

                    <button
                        onClick={chatWA}
                        data-testid="wa-chat-btn"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-brand-200 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Tanyakan produk ini via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}
