import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { X, Upload, ChevronLeft, Loader2 } from "lucide-react";
import { api, formatApiErrorDetail, getFileUrl } from "@/lib/api";
import { toast } from "sonner";
import ClickSpark from "@/components/magic/ClickSpark";

const EMPTY = {
    name: "",
    description: "",
    category_id: "",
    price: 0,
    discount_price: 0,
    sku: "",
    barcode: "",
    stock: 0,
    images: [],
    is_active: true,
    is_featured: false,
};

export default function AdminProductForm() {
    const { id } = useParams();
    const isEdit = !!id;
    const nav = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [cats, setCats] = useState([]);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        api.get("/categories").then(({ data }) => {
            setCats(data);
            if (!isEdit && data.length && !form.category_id) {
                setForm((f) => ({ ...f, category_id: data[0].id }));
            }
        });
        if (isEdit) {
            api.get(`/products/${id}`).then(({ data }) => {
                setForm({
                    name: data.name,
                    description: data.description || "",
                    category_id: data.category_id,
                    price: data.price,
                    discount_price: data.discount_price || 0,
                    sku: data.sku || "",
                    barcode: data.barcode || "",
                    stock: data.stock,
                    images: data.images || [],
                    is_active: data.is_active,
                    is_featured: data.is_featured || false,
                });
            });
        }
        // eslint-disable-next-line
    }, [id]);

    const handleFile = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length === 0) return;
        setUploading(true);
        try {
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} > 5MB. Kompres dulu.`);
                    continue;
                }
                const fd = new FormData();
                fd.append("file", file);
                try {
                    const { data } = await api.post("/admin/upload", fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    setForm((f) => ({ ...f, images: [...f.images, data.path] }));
                } catch (err) {
                    toast.error(`Gagal upload ${file.name}: ${formatApiErrorDetail(err.response?.data?.detail) || err.message}`);
                }
            }
            toast.success("Foto berhasil di-upload");
        } finally {
            setUploading(false);
        }
    };

    const removeImg = (idx) => {
        setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.category_id) {
            toast.error("Pilih kategori dulu.");
            return;
        }
        setBusy(true);
        const payload = {
            ...form,
            price: Number(form.price),
            discount_price: Number(form.discount_price) || 0,
            stock: Number(form.stock),
        };
        try {
            if (isEdit) {
                await api.put(`/admin/products/${id}`, payload);
                toast.success("Produk diperbarui");
            } else {
                await api.post("/admin/products", payload);
                toast.success("Produk dibuat");
            }
            nav("/admin/products");
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <Link
                to="/admin/products"
                className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-brand-200 mb-6"
            >
                <ChevronLeft className="w-4 h-4" /> Kembali
            </Link>
            <h1 className="font-display text-3xl mb-8">
                {isEdit ? "Edit Produk" : "Produk Baru"}
            </h1>
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-3">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 block">
                        Nama Produk
                    </label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        data-testid="product-form-name"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <label className="text-xs uppercase tracking-widest text-zinc-500 block mt-4">
                        Deskripsi
                    </label>
                    <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        data-testid="product-form-desc"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                Kategori
                            </label>
                            <select
                                required
                                value={form.category_id}
                                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                data-testid="product-form-category"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            >
                                <option value="">Pilih kategori</option>
                                {cats.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                Stok
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                data-testid="product-form-stock"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                Harga
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                data-testid="product-form-price"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                Harga Diskon (opsional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.discount_price}
                                onChange={(e) =>
                                    setForm({ ...form, discount_price: e.target.value })
                                }
                                data-testid="product-form-discount"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                SKU
                            </label>
                            <input
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                data-testid="product-form-sku"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">
                                Barcode
                            </label>
                            <input
                                value={form.barcode}
                                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                data-testid="product-form-barcode"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                data-testid="product-form-active"
                            />
                            Aktifkan produk
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_featured}
                                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                data-testid="product-form-featured"
                            />
                            Featured (populer)
                        </label>
                    </div>
                </div>

                {/* Images */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 block mb-4">
                        Foto Produk
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {form.images.map((im, i) => (
                            <div
                                key={i}
                                className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                            >
                                <img src={getFileUrl(im)} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImg(i)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label
                            data-testid="product-form-upload"
                            className={`aspect-square rounded-lg border border-dashed transition-colors grid place-items-center cursor-pointer ${
                                uploading
                                    ? "border-brand-200 bg-brand-200/10 text-brand-200"
                                    : "border-white/20 hover:border-brand-200 hover:bg-white/5 text-zinc-500"
                            }`}
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFile}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-zinc-500 mt-3">
                        Format JPG/PNG/WebP. Maksimal 5MB per file. Foto pertama menjadi thumbnail. Disimpan ke object storage.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => nav("/admin/products")}
                        className="rounded-full px-6 py-2.5 text-sm border border-white/10 hover:bg-white/5"
                    >
                        Batal
                    </button>
                    <ClickSpark>
                        <button
                            type="submit"
                            disabled={busy}
                            data-testid="product-form-save"
                            className="rounded-full bg-brand-200 text-zinc-950 px-6 py-2.5 text-sm font-medium hover:bg-brand-300 disabled:opacity-40"
                        >
                            {busy ? "Menyimpan..." : "Simpan Produk"}
                        </button>
                    </ClickSpark>
                </div>
            </form>
        </div>
    );
}
