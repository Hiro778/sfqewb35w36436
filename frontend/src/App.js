import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

import CustomerLayout from "@/components/customer/CustomerLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedCustomer from "@/components/customer/ProtectedCustomer";
import ProtectedAdmin from "@/components/admin/ProtectedAdmin";

// Customer pages
import Home from "@/pages/customer/Home";
import Products from "@/pages/customer/Products";
import ProductDetail from "@/pages/customer/ProductDetail";
import Cart from "@/pages/customer/Cart";
import Checkout from "@/pages/customer/Checkout";
import Login from "@/pages/customer/Login";
import Register from "@/pages/customer/Register";
import ForgotPassword from "@/pages/customer/ForgotPassword";
import ResetPassword from "@/pages/customer/ResetPassword";
import Profile from "@/pages/customer/Profile";
import Orders from "@/pages/customer/Orders";
import InvoicePrint from "@/pages/customer/InvoicePrint";

// Admin pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminFirstSetup from "@/pages/admin/AdminFirstSetup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminProductForm from "@/pages/admin/AdminProductForm";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminDiscounts from "@/pages/admin/AdminDiscounts";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminInvoiceForm from "@/pages/admin/AdminInvoiceForm";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminSettings from "@/pages/admin/AdminSettings";

export default function App() {
    return (
        <BrowserRouter>
            <SettingsProvider>
                <AuthProvider>
                    <CartProvider>
                        <Toaster
                            theme="dark"
                            richColors
                            position="top-center"
                            toastOptions={{
                                style: {
                                    background: "#18181b",
                                    color: "#fafafa",
                                    border: "1px solid #27272a",
                                },
                            }}
                        />
                        <Routes>
                            {/* Customer routes */}
                            <Route element={<CustomerLayout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/products/:slug" element={<ProductDetail />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedCustomer>
                                            <Profile />
                                        </ProtectedCustomer>
                                    }
                                />
                                <Route
                                    path="/orders"
                                    element={
                                        <ProtectedCustomer>
                                            <Orders />
                                        </ProtectedCustomer>
                                    }
                                />
                            </Route>

                            {/* Invoice print page (no layout) */}
                            <Route path="/invoice/:id/print" element={<InvoicePrint />} />

                            {/* Admin routes */}
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route
                                path="/admin/first-setup"
                                element={
                                    <ProtectedAdmin allowFirstSetup>
                                        <AdminFirstSetup />
                                    </ProtectedAdmin>
                                }
                            />
                            <Route
                                element={
                                    <ProtectedAdmin>
                                        <AdminLayout />
                                    </ProtectedAdmin>
                                }
                            >
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/products" element={<AdminProducts />} />
                                <Route path="/admin/products/new" element={<AdminProductForm />} />
                                <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                                <Route path="/admin/categories" element={<AdminCategories />} />
                                <Route path="/admin/discounts" element={<AdminDiscounts />} />
                                <Route path="/admin/inventory" element={<AdminInventory />} />
                                <Route path="/admin/orders" element={<AdminOrders />} />
                                <Route path="/admin/invoices" element={<AdminInvoices />} />
                                <Route path="/admin/invoices/new" element={<AdminInvoiceForm />} />
                                <Route path="/admin/invoices/:id/edit" element={<AdminInvoiceForm />} />
                                <Route path="/admin/customers" element={<AdminCustomers />} />
                                <Route path="/admin/settings" element={<AdminSettings />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </CartProvider>
                </AuthProvider>
            </SettingsProvider>
        </BrowserRouter>
    );
}
