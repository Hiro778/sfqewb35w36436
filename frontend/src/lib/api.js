import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    withCredentials: false,
});

/**
 * Resolve stored image reference to a displayable URL.
 * - If it's a full URL (http/https) or data: URI, return as-is.
 * - If it looks like a storage path ("hazzeon-commerce/products/..."), serve via backend.
 */
export function getFileUrl(pathOrUrl) {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("data:")) {
        return pathOrUrl;
    }
    return `${API}/files/${pathOrUrl}`;
}

// Attach JWT token if present
api.interceptors.request.use((cfg) => {
    const tok =
        localStorage.getItem("hz_token") ||
        localStorage.getItem("hz_admin_token") ||
        null;
    // Admin token takes precedence for /admin/* endpoints
    const adminTok = localStorage.getItem("hz_admin_token");
    const userTok = localStorage.getItem("hz_token");

    const url = cfg.url || "";
    if (url.startsWith("/admin") || url.includes("/admin/")) {
        if (adminTok) cfg.headers.Authorization = `Bearer ${adminTok}`;
    } else {
        if (userTok) cfg.headers.Authorization = `Bearer ${userTok}`;
        else if (adminTok) cfg.headers.Authorization = `Bearer ${adminTok}`;
    }
    return cfg;
});

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export function formatRupiah(n) {
    const v = Number(n || 0);
    return "Rp" + Math.round(v).toLocaleString("id-ID");
}

export function computeEffectivePrice(product) {
    if (!product) return 0;
    const dp = Number(product.discount_price || 0);
    const p = Number(product.price || 0);
    return dp > 0 && dp < p ? dp : p;
}
