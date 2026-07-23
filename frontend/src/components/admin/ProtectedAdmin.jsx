import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedAdmin({ children, allowFirstSetup = false }) {
    const { admin, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-zinc-950">
                <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-transparent animate-spin" />
            </div>
        );
    }
    if (!admin) return <Navigate to="/admin/login" replace />;
    if (!admin.first_setup_done && !allowFirstSetup) {
        return <Navigate to="/admin/first-setup" replace />;
    }
    if (admin.first_setup_done && allowFirstSetup) {
        return <Navigate to="/admin" replace />;
    }
    return children;
}
