import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import Hero from "@/components/customer/home/Hero";
import USPSection from "@/components/customer/home/USPSection";
import CategorySection from "@/components/customer/home/CategorySection";
import SaleBanner from "@/components/customer/home/SaleBanner";
import ProductRow from "@/components/customer/home/ProductRow";
import CTASection from "@/components/customer/home/CTASection";

const HERO_IMG =
    "https://images.unsplash.com/photo-1720022785516-9653ead7180c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwbW9kZWwlMjBkYXJrJTIwYWVzdGhldGljfGVufDB8fHx8MTc4NDgwNzgzNHw&ixlib=rb-4.0.3&q=85&w=1600&s=4f04366df8b5c5f13f8b8e0e85c6f0b4";

const CATEGORY_IMAGES = {
    Baju: "https://images.pexels.com/photos/14867670/pexels-photo-14867670.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Celana: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Aksesoris:
        "https://images.unsplash.com/photo-1635462684825-3621c1df5403?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhY2Nlc3NvcmllcyUyMGRhcmt8ZW58MHx8fHwxNzg0ODA0NjQ2fQ&ixlib=rb-4.0.3&q=85&w=1600&s=1e6b8a1a1b4c5f3d1b2c3d4e5f6a7b8c",
    Sepatu: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=940&q=80",
    Tas: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=940&q=80",
    "Jaket & Outer":
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=940&q=80",
};

export default function Home() {
    const { settings } = useSettings();
    const [categories, setCategories] = useState([]);
    const [newest, setNewest] = useState([]);
    const [popular, setPopular] = useState([]);
    const [onSale, setOnSale] = useState([]);

    useEffect(() => {
        (async () => {
            const [c, n, p, s] = await Promise.all([
                api.get("/categories"),
                api.get("/products", { params: { sort: "newest", limit: 8 } }),
                api.get("/products", { params: { sort: "popular", limit: 8 } }),
                api.get("/products", { params: { on_sale: 1, limit: 8 } }),
            ]);
            setCategories(c.data);
            setNewest(n.data);
            setPopular(p.data);
            setOnSale(s.data);
        })();
    }, []);

    return (
        <div>
            <Hero heroImage={HERO_IMG} />
            <USPSection />
            <CategorySection categories={categories} categoryImages={CATEGORY_IMAGES} />
            {onSale.length > 0 && <SaleBanner />}
            {newest.length > 0 && <ProductRow title="Just arrived" sub="Newest drops from our workshop" items={newest} />}
            {onSale.length > 0 && <ProductRow title="On sale" sub="Discounted picks — while stocks last" items={onSale} />}
            {popular.length > 0 && <ProductRow title="Most loved" sub="Community favorites" items={popular} />}
            <CTASection settings={settings} />
        </div>
    );
}
