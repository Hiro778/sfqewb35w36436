import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatRupiah, computeEffectivePrice, getFileUrl } from "@/lib/api";

export default function ProductCard({ product }) {
    const effective = computeEffectivePrice(product);
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const outOfStock = product.stock <= 0;
    const img = (product.images && product.images[0]) ? getFileUrl(product.images[0]) : null;

    return (
        <Link
            to={`/products/${product.slug || product.id}`}
            data-testid={`product-card-${product.id}`}
            className="group block"
        >
            <motion.div
                whileHover={{
                    y: -8,
                    scale: 1.015
                 }}
                 transition={{
                     duration: 0.45,
                     ease: [0.22, 1, 0.36, 1]
                 }}
                 className="relative h-[340px] sm:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/20 cursor-pointer"
        >
                {img ? (
                    <img
                        src={img}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full grid place-items-center text-zinc-700 font-display text-4xl">
                        {product.name?.[0] || "?"}
                    </div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {hasDiscount && (
                        <span className="rounded-full bg-brand-200 text-zinc-950 text-[10px] font-semibold px-2.5 py-1 tracking-wider uppercase">
                            Sale
                        </span>
                    )}
                    {outOfStock && (
                        <span className="rounded-full bg-red-500/90 text-white text-[10px] font-semibold px-2.5 py-1 tracking-wider uppercase">
                            Habis
                        </span>
                    )}
                </div>
            </motion.div>
            <div className="mt-3">
                <p className="text-sm text-zinc-200 line-clamp-1">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-brand-200 font-medium">{formatRupiah(effective)}</span>
                    {hasDiscount && (
                        <span className="text-xs text-zinc-500 line-through">
                            {formatRupiah(product.price)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
