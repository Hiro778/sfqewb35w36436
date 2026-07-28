import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero({ heroImage }) {
    return (
        <section className="relative overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
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
    );
}
