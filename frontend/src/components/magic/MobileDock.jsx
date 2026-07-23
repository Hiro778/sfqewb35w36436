import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Grid3x3, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

/**
 * MobileDock — floating bottom nav on customer mobile view only.
 * Uses framer-motion for hover-scale magnification on the active item.
 */
export default function MobileDock() {
    const location = useLocation();
    const { totals } = useCart();

    const items = [
        { to: "/", icon: Home, label: "Home", testid: "dock-home" },
        { to: "/products", icon: Grid3x3, label: "Products", testid: "dock-products" },
        {
            to: "/cart",
            icon: ShoppingBag,
            label: "Cart",
            testid: "dock-cart",
            badge: totals.count,
        },
        { to: "/profile", icon: User, label: "Profile", testid: "dock-profile" },
    ];

    return (
        <div
            className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            data-testid="mobile-dock"
        >
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-900/85 backdrop-blur-xl border border-white/10 px-3 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
                {items.map((it) => {
                    const isActive =
                        it.to === "/" ? location.pathname === "/" : location.pathname.startsWith(it.to);
                    const Icon = it.icon;
                    return (
                        <Link
                            key={it.to}
                            to={it.to}
                            data-testid={it.testid}
                            className="relative"
                            aria-label={it.label}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.15 }}
                                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                                    isActive ? "bg-brand-200 text-zinc-950" : "text-zinc-300"
                                }`}
                            >
                                <Icon className="w-5 h-5" strokeWidth={1.75} />
                                {it.badge > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center"
                                        data-testid="dock-cart-badge"
                                    >
                                        {it.badge}
                                    </span>
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
