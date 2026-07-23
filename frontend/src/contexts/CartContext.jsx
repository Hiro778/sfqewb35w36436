import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
const STORAGE_KEY = "hz_cart_v1";

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const add = (product, qty = 1) => {
        setItems((prev) => {
            const idx = prev.findIndex((i) => i.product_id === product.id);
            const effectivePrice =
                product.discount_price && product.discount_price > 0 && product.discount_price < product.price
                    ? product.discount_price
                    : product.price;
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
                return next;
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    price: effectivePrice,
                    image: (product.images && product.images[0]) || "",
                    stock: product.stock,
                    slug: product.slug,
                    quantity: qty,
                },
            ];
        });
        toast.success(`${product.name} ditambahkan ke keranjang`);
    };

    const remove = (product_id) => {
        setItems((prev) => prev.filter((i) => i.product_id !== product_id));
    };

    const updateQty = (product_id, qty) => {
        setItems((prev) =>
            prev
                .map((i) => (i.product_id === product_id ? { ...i, quantity: Math.max(1, qty) } : i))
                .filter((i) => i.quantity > 0)
        );
    };

    const clear = () => setItems([]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const count = items.reduce((s, i) => s + i.quantity, 0);
        return { subtotal, count };
    }, [items]);

    return (
        <CartContext.Provider value={{ items, add, remove, updateQty, clear, totals }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
