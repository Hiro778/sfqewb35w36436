import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationBell() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const load = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get("/notifications");
            setItems(data.items || []);
            setUnread(data.unread || 0);
        } catch {
            // silent
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setUnread(0);
            return;
        }
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [user, load]);

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAll = async () => {
        await api.put("/notifications/read-all");
        setItems((x) => x.map((n) => ({ ...n, is_read: true })));
        setUnread(0);
    };

    const markOne = async (id) => {
        await api.put(`/notifications/${id}/read`);
        setItems((x) => x.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnread((u) => Math.max(0, u - 1));
    };

    if (!user) return null;

    return (
        <div className="relative" ref={wrapRef}>
            <button
                onClick={() => setOpen((o) => !o)}
                data-testid="notif-bell-btn"
                className="relative w-10 h-10 rounded-full border border-white/10 grid place-items-center hover:bg-white/5 transition-colors"
                aria-label="Notifikasi"
            >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                    <span
                        data-testid="notif-unread-badge"
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-200 text-zinc-950 text-[10px] font-semibold grid place-items-center"
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden z-50"
                        data-testid="notif-panel"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-medium">Notifikasi</p>
                            {unread > 0 && (
                                <button
                                    onClick={markAll}
                                    className="text-xs text-brand-200 hover:underline inline-flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3 h-3" /> Tandai dibaca
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {items.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-zinc-500">
                                    Belum ada notifikasi.
                                </p>
                            ) : (
                                items.map((n) => (
                                    <Link
                                        key={n.id}
                                        to={n.link || "#"}
                                        onClick={() => {
                                            if (!n.is_read) markOne(n.id);
                                            setOpen(false);
                                        }}
                                        data-testid={`notif-item-${n.id}`}
                                        className={`block px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                                            !n.is_read ? "bg-brand-200/5" : ""
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!n.is_read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-200 mt-1.5 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{n.title}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 mt-1">
                                                    {new Date(n.created_at).toLocaleString("id-ID")}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
