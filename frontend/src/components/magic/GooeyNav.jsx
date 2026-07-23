import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * GooeyNav — top nav with a fluid blob highlight behind hovered/active link.
 * Uses SVG feGaussianBlur + feColorMatrix for the gooey effect on the blob layer.
 */
export default function GooeyNav({ items = [] }) {
    const location = useLocation();
    const [hoverIdx, setHoverIdx] = useState(null);

    const activeIdx = items.findIndex((it) =>
        it.to === "/" ? location.pathname === "/" : location.pathname.startsWith(it.to)
    );

    const targetIdx = hoverIdx ?? (activeIdx >= 0 ? activeIdx : null);

    return (
        <nav
            className="relative flex items-center"
            onMouseLeave={() => setHoverIdx(null)}
            data-testid="gooey-nav"
        >
            <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="hz-gooey">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            <ul className="relative flex gap-1 p-1 rounded-full bg-zinc-900/70 backdrop-blur-xl border border-white/10">
                <li
                    className="absolute inset-y-1 pointer-events-none"
                    style={{ filter: "url(#hz-gooey)" }}
                    aria-hidden
                >
                    {targetIdx !== null && (
                        <motion.div
                            layout
                            initial={false}
                            className="absolute h-full bg-brand-200 rounded-full"
                            animate={{
                                x: `calc(${targetIdx * 100}% + ${targetIdx * 4}px)`,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            style={{ width: `calc(100% / ${items.length})` }}
                        />
                    )}
                </li>
                {items.map((it, i) => {
                    const isActive = i === activeIdx;
                    return (
                        <li
                            key={it.label}
                            onMouseEnter={() => setHoverIdx(i)}
                            className="relative"
                        >
                            <Link
                                to={it.to}
                                data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                                className={`relative z-10 block px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                                    isActive || hoverIdx === i
                                        ? "text-zinc-950"
                                        : "text-zinc-300 hover:text-white"
                                }`}
                            >
                                {it.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
