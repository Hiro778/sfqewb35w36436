import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Tags,
    Percent,
    Boxes,
    ShoppingBag,
    Receipt,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    { to: "/admin/discounts", label: "Discounts", icon: Percent },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/invoices", label: "Invoices", icon: Receipt },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
    const { admin, adminLogout } = useAuth();
    const nav = useNavigate();
    const [mobile, setMobile] = useState(false);

    const logout = () => {
        adminLogout();
        nav("/admin/login");
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
            {/* Sidebar */}
            <aside
                className={`fixed md:static z-40 inset-y-0 left-0 w-64 border-r border-white/5 bg-zinc-950 flex flex-col transition-transform ${
                    mobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-brand-200 grid place-items-center text-zinc-950 font-display font-bold text-sm">
                            H
                        </span>
                        <div>
                            <div className="font-display text-sm leading-none">Hazze'On</div>
                            <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                                Admin
                            </div>
                        </div>
                    </div>
                    <button
                        className="md:hidden text-zinc-400"
                        onClick={() => setMobile(false)}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {NAV.map((it) => {
                        const Icon = it.icon;
                        return (
                            <NavLink
                                key={it.to}
                                to={it.to}
                                end={it.end}
                                onClick={() => setMobile(false)}
                                data-testid={`admin-nav-${it.label.toLowerCase()}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                                        isActive
                                            ? "bg-brand-200 text-zinc-950 font-medium"
                                            : "text-zinc-300 hover:bg-white/5"
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4" strokeWidth={1.75} />
                                {it.label}
                            </NavLink>
                        );
                    })}
                </nav>
                <div className="p-3 border-t border-white/5">
                    <div className="px-2 pb-3 text-xs text-zinc-500">
                        Logged in as{" "}
                        <span className="text-zinc-300">
                            {admin?.username || admin?.name || "admin"}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        data-testid="admin-logout-btn"
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/5"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
                <header className="md:hidden sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setMobile(true)} aria-label="Open sidebar">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-display text-lg">Admin</span>
                </header>
                <main className="flex-1 p-4 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
