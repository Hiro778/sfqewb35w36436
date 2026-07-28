import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CategorySection({ categories = [], categoryImages = {} }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-brand-200 font-semibold">Explore</p>
          <h2 className="font-display text-4xl sm:text-5xl mt-2">Shop by category</h2>
        </div>
        <Link to="/products" className="hidden md:inline text-sm text-zinc-400 hover:text-brand-200 transition-colors">
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
                src={c.image || categoryImages[c.name] || categoryImages.Baju}
                alt={c.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="font-display text-2xl">{c.name}</p>
                <p className="text-xs text-zinc-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{c.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
