import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { api, formatRupiah, computeEffectivePrice } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import ProductCard from "@/components/customer/ProductCard";

const HERO_IMG =
    "https://images.unsplash.com/photo-1720022785516-9653ead7180c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWwlMjBkYXJrJTIwYWVzdGhldGljfGVufDB8fHx8MTc4NDgwNDY0Nnww&ixlib=rb-4.1.0&q=85";

const CATEGORY_IMAGES = {
    Baju: "https://images.pexels.com/photos/14867670/pexels-photo-14867670.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Celana: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Aksesoris:
        "https://images.unsplash.com/photo-1635462684825-3621c1df5403?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhY2Nlc3NvcmllcyUyMGRhcmt8ZW58MHx8fHwxNzg0ODA0NjQ2fDA&ixlib=rb-4.1.0&q=85",
    Sepatu: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=940&q=80",
    Tas: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=940&q=80",
    "Jaket & Outer":
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=940&q=80",
};

export default function Home() {
    const { settings } = useSettings();
    const [categories, setCategories] = useState([]);
    const [newest, setNewest] = useState([]);
    const [popular, setPopular] = useState([]);
    const [onSale, setOnSale] = useState([]);

    useEffect(() => {
        (async () => {
            const [c, n, p, s] = await Promise.all([
                api.get("/categories"),
                api.get("/products", { params: { sort: "newest", limit: 8 } }),
                api.get("/products", { params: { sort: "popular", limit: 8 } }),
                api.get("/products", { params: { on_sale: 1, limit: 8 } }),
            ]);
            setCategories(c.data);
            setNewest(n.data);
            setPopular(p.data);
            setOnSale(s.data);
        })();
    }, []);

    return (
        <div>
            {/* HERO */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${HERO_IMG})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/70 to-zinc-950/30" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-24 md:py-40">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.15em] uppercase text-brand-200 backdrop-blur">
                            <Sparkles className="w-3 h-3" />
                            New Season / 26
                        </div>
                        <h1 className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight">
                            <span className="text-white">Where fabric</span>
                            <br />
                            <span className="italic text-brand-200">meets intention.</span>
                        </h1>
                        <p className="mt-6 text-lg text-zinc-300 max-w-xl leading-relaxed">
                            Modern Indonesian fashion curated for people who care about craft.
                            Checkout langsung via WhatsApp — sederhana, cepat, dan personal.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-3">
                            <Link
                                to="/products"
                                data-testid="hero-shop-btn"
                                className="group inline-flex items-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-7 py-3.5 font-medium hover:bg-brand-300 transition-colors"
                            >
                                Shop the collection
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                to="/products?sale=1"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                See offers
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* USP strip */}
            <section className="border-y border-white/5 bg-zinc-900/40">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 divide-x divide-white/5">
                    {[
                        { icon: Truck, title: "Ship nationwide", sub: "Seluruh Indonesia" },
                        { icon: ShieldCheck, title: "Quality first", sub: "Kurasi ketat" },
                        { icon: MessageCircle, title: "Personal support", sub: "WhatsApp langsung" },
                    ].map((it) => {
                        const Icon = it.icon;
                        return (
                            <div key={it.title} className="flex items-center gap-4 px-6 py-6">
                                <div className="w-10 h-10 rounded-full bg-brand-200/10 text-brand-200 grid place-items-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{it.title}</p>
                                    <p className="text-xs text-zinc-500">{it.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">
                            Explore
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl mt-2">Shop by category</h2>
                    </div>
                    <Link
                        to="/products"
                        className="hidden md:inline text-sm text-zinc-400 hover:text-brand-200 transition-colors"
                    >
                        View all →
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {categories.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                        >
                            <Link
                                to={`/products?category=${c.id}`}
                                data-testid={`home-category-${c.slug}`}
                                className="group block relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10"
                            >
                                <img
                                    src={c.image || CATEGORY_IMAGES[c.name] || CATEGORY_IMAGES.Baju}
                                    alt={c.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <p className="font-display text-2xl">{c.name}</p>
                                    <p className="text-xs text-zinc-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {c.description}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Sale banner */}
            {onSale.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
                    <div className="relative overflow-hidden rounded-3xl border border-brand-200/20 bg-gradient-to-r from-brand-200/10 via-brand-200/5 to-transparent p-8 md:p-12">
                        <div className="absolute right-0 top-0 h-full w-72 opacity-30 bg-[radial-gradient(circle_at_top_right,_#e4d3b5,_transparent_70%)]" />
                        <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">
                            Limited Offer
                        </p>
                        <h3 className="font-display text-3xl md:text-4xl mt-2 max-w-xl">
                            Selected pieces at{" "}
                            <span className="italic text-brand-200">up to 40% off</span>
                        </h3>
                        <Link
                            to="/products?sale=1"
                            className="inline-flex items-center gap-2 mt-4 text-sm text-brand-200 hover:text-brand-100"
                        >
                            Shop the sale <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </section>
            )}

            {/* Newest */}
            {newest.length > 0 && (
                <ProductRow title="Just arrived" sub="Newest drops from our workshop" items={newest} />
            )}

            {/* On sale */}
            {onSale.length > 0 && (
                <ProductRow title="On sale" sub="Discounted picks — while stocks last" items={onSale} />
            )}

            {/* Popular */}
            {popular.length > 0 && (
                <ProductRow title="Most loved" sub="Community favorites" items={popular} />
            )}

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-24">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-10 md:p-16 text-center">
                    <h3 className="font-display text-3xl md:text-5xl">
                        Punya pertanyaan? Chat langsung admin.
                    </h3>
                    <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
                        Kami siap membantu memilih ukuran, mengecek stok, atau menyiapkan pengiriman.
                    </p>
                    {settings?.whatsapp_number && (
                        <a
                            href={`https://wa.me/${settings.whatsapp_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="home-wa-cta"
                            className="inline-flex items-center gap-2 mt-6 rounded-full bg-brand-200 text-zinc-950 px-7 py-3.5 font-medium hover:bg-brand-300 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Chat WhatsApp
                        </a>
                    )}
                </div>
            </section>
        </div>
    );
}

function ProductRow({ title, sub, items }) {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{sub}</p>
                </div>
                <Link
                    to="/products"
                    className="text-sm text-zinc-400 hover:text-brand-200 transition-colors"
                >
                    View all →
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.slice(0, 8).map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
}
