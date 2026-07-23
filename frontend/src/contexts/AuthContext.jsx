import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // customer user
    const [admin, setAdmin] = useState(null); // admin user
    const [loading, setLoading] = useState(true);

    const loadCustomer = useCallback(async () => {
        const tok = localStorage.getItem("hz_token");
        if (!tok) return null;
        try {
            const { data } = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (data.role === "customer") {
                setUser(data);
                return data;
            }
            return null;
        } catch (e) {
            localStorage.removeItem("hz_token");
            return null;
        }
    }, []);

    const loadAdmin = useCallback(async () => {
        const tok = localStorage.getItem("hz_admin_token");
        if (!tok) return null;
        try {
            const { data } = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (data.role === "admin") {
                setAdmin(data);
                return data;
            }
            return null;
        } catch (e) {
            localStorage.removeItem("hz_admin_token");
            return null;
        }
    }, []);

    useEffect(() => {
        (async () => {
            await Promise.all([loadCustomer(), loadAdmin()]);
            setLoading(false);
        })();
    }, [loadCustomer, loadAdmin]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            localStorage.setItem("hz_token", data.token);
            setUser(data.user);
            return data.user;
        } catch (e) {
            const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
            toast.error(msg);
            throw e;
        }
    };

    const register = async (payload) => {
        try {
            const { data } = await api.post("/auth/register", payload);
            localStorage.setItem("hz_token", data.token);
            setUser(data.user);
            return data.user;
        } catch (e) {
            const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
            toast.error(msg);
            throw e;
        }
    };

    const logout = () => {
        localStorage.removeItem("hz_token");
        setUser(null);
        toast.success("Berhasil logout");
    };

    const adminLogin = async (username, password) => {
        try {
            const { data } = await api.post("/admin/login", { username, password });
            localStorage.setItem("hz_admin_token", data.token);
            setAdmin(data.user);
            return data;
        } catch (e) {
            const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
            toast.error(msg);
            throw e;
        }
    };

    const adminLogout = () => {
        localStorage.removeItem("hz_admin_token");
        setAdmin(null);
    };

    const refreshAdmin = async () => loadAdmin();

    const updateUser = (u) => setUser(u);

    return (
        <AuthContext.Provider
            value={{
                user,
                admin,
                loading,
                login,
                register,
                logout,
                adminLogin,
                adminLogout,
                refreshAdmin,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
