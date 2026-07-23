import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function AdminCategories() {
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: "", description: "", image: "" });

    const load = () => api.get("/categories").then(({ data }) => setItems(data));
    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm({ name: "", description: "", image: "" });
        setShowForm(true);
    };
    const openEdit = (c) => {
        setEditing(c);
        setForm({ name: c.name, description: c.description || "", image: c.image || "" });
        setShowForm(true);
    };
    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/categories/${editing.id}`, form);
                toast.success("Kategori diperbarui");
            } else {
                await api.post("/categories", form);
                toast.success("Kategori dibuat");
            }
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        }
    };
    const del = async (id) => {
        if (!window.confirm("Hapus kategori?")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success("Terhapus");
            load();
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl">Kategori</h1>
                    <p className="text-sm text-zinc-400">{items.length} kategori</p>
                </div>
                <button
                    onClick={openNew}
                    data-testid="admin-add-category-btn"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-200 text-zinc-950 px-5 py-2.5 font-medium text-sm hover:bg-brand-300"
                >
                    <Plus className="w-4 h-4" /> Kategori Baru
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((c) => (
                    <div
                        key={c.id}
                        className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
                        data-testid={`admin-cat-${c.slug}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-display text-xl">{c.name}</p>
                                <p className="text-xs text-zinc-500 mt-1">{c.slug}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(c)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => del(c.id)}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 mt-3 line-clamp-2">
                            {c.description || "—"}
                        </p>
                    </div>
                ))}
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 grid place-items-center px-4"
                    onClick={() => setShowForm(false)}
                >
                    <form
                        onSubmit={save}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 space-y-3"
                    >
                        <h3 className="font-display text-2xl">
                            {editing ? "Edit Kategori" : "Kategori Baru"}
                        </h3>
                        <input
                            required
                            placeholder="Nama"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            data-testid="cat-form-name"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <textarea
                            rows={3}
                            placeholder="Deskripsi (opsional)"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            data-testid="cat-form-desc"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-full px-4 py-2 text-sm border border-white/10"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                data-testid="cat-form-save"
                                className="rounded-full bg-brand-200 text-zinc-950 px-4 py-2 text-sm font-medium hover:bg-brand-300"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
