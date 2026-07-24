import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GooeyNav from "@/components/magic/GooeyNav";
import MobileDock from "@/components/magic/MobileDock";
import NotificationBell from "@/components/customer/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";

const NAV_ITEMS = [
    { label: "Home", to: "/" },
    { label: "Products", to: "/products" },
    { label: "Promo", to: "/products?sale=1" },
    { label: "Contact", to: "/#contact" },
];

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const { totals } = useCart();
    const { settings } = useSettings();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 grain">
            {/* HEADER */}
            <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4">
                    <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-brand-200 grid place-items-center text-zinc-950 font-display font-bold text-sm">
                            H
                        </span>
                        <span className="font-display text-xl tracking-tight">
                            {settings?.business_name || "Hazze'On"}
                        </span>
                    </Link>

                    <div className="hidden md:block">
                        <GooeyNav items={NAV_ITEMS} />
                    </div>

                    <div className="flex items-center gap-2">
                        {user && <NotificationBell />}
                        <Link
                            to="/cart"
                            data-testid="header-cart-link"
                            className="relative w-10 h-10 rounded-full border border-white/10 grid place-items-center hover:bg-white/5 transition-colors"
                            aria-label="Cart"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {totals.count > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold grid place-items-center">
                                    {totals.count}
                                </span>
                            )}
                        </Link>
                        {user ? (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/profile"
                                    data-testid="header-profile-link"
                                    className="text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-full border border-white/10"
                                >
                                    <User className="w-4 h-4 inline mr-1" />
                                    {user.name?.split(" ")[0]}
                                </Link>
                                <button
                                    onClick={logout}
                                    data-testid="header-logout-btn"
                                    className="text-sm text-zinc-400 hover:text-white p-2"
                                    aria-label="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                data-testid="header-login-link"
                                className="hidden md:block text-sm px-4 py-2 rounded-full bg-brand-200 text-zinc-950 font-medium hover:bg-brand-300 transition-colors"
                            >
                                Login
                            </Link>
                        )}
                        <button
                            className="md:hidden text-zinc-300"
                            onClick={() => setMobileOpen(true)}
                            data-testid="mobile-menu-btn"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 260, damping: 30 }}
                            className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-zinc-950 border-l border-white/10 p-6 md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-display text-lg">Menu</span>
                                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                                    <X className="w-6 h-6 text-zinc-400" />
                                </button>
                            </div>
                            <nav className="flex flex-col gap-3">
                                {NAV_ITEMS.map((it) => (
                                    <Link
                                        key={it.to}
                                        to={it.to}
                                        onClick={() => setMobileOpen(false)}
                                        className="text-lg font-display hover:text-brand-200 transition-colors"
                                    >
                                        {it.label}
                                    </Link>
                                ))}
                                <div className="h-px bg-white/10 my-4" />
                                {user ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            onClick={() => setMobileOpen(false)}
                                            className="text-sm text-zinc-300"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            to="/orders"
                                            onClick={() => setMobileOpen(false)}
                                            className="text-sm text-zinc-300"
                                        >
                                            Order History
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setMobileOpen(false);
                                            }}
                                            className="text-sm text-zinc-400 text-left"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            onClick={() => setMobileOpen(false)}
                                            className="text-sm text-brand-200"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setMobileOpen(false)}
                                            className="text-sm text-zinc-300"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content */}
            <main className="min-h-[70vh] pb-32 md:pb-16">
                <Outlet />
            </main>

            {/* Footer */}
            <footer
                id="contact"
                className="border-t border-white/5 bg-zinc-950 pt-16 pb-24 md:pb-12 px-4 sm:px-8"
            >
                <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-full bg-brand-200 grid place-items-center text-zinc-950 font-display font-bold text-sm">
                                H
                            </span>
                            <span className="font-display text-xl">
                                {settings?.business_name || "Hazze'On Commerce"}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400 max-w-md">
                            Premium fashion untuk gaya hidup modern. Checkout langsung via WhatsApp,
                            respon cepat dari admin kami.
                        </p>
                    </div>
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">
                            Kontak
                        </p>
                        <p className="text-sm text-zinc-300">
                            WA: +{(settings?.whatsapp_number || "").replace(/^\+/, "") || "-"}
                        </p>
                        <p className="text-sm text-zinc-400">{settings?.email || ""}</p>
                        <p className="text-sm text-zinc-400 mt-1">{settings?.address || ""}</p>
                    </div>
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">
                            Menu
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link to="/products" className="text-sm text-zinc-300 hover:text-white">
                                Products
                            </Link>
                            <Link
                                to="/products?sale=1"
                                className="text-sm text-zinc-300 hover:text-white"
                            >
                                Promo
                            </Link>
                            <Link to="/orders" className="text-sm text-zinc-300 hover:text-white">
                                My Orders
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 text-xs text-zinc-500 text-center">
                    © {new Date().getFullYear()} {settings?.business_name || "Hazze'On Commerce"}.
                    Handcrafted with obsession.
                </div>
            </footer>

            <MobileDock />
        </div>
    );
}
