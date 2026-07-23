import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedCustomer({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-zinc-950">
                <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-transparent animate-spin" />
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
