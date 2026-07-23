# Hazze'On Commerce - PRD

## Original Problem Statement
Build production-ready modern e-commerce for Indonesian SME (fashion). Customers checkout via WhatsApp (no payment gateway). Single admin panel at /admin (hidden). Default admin/1234 must be permanently disabled after first-login setup.

## Tech (user-approved adaptation from prompt)
- Frontend: React + Tailwind + shadcn/ui + Framer Motion (fonts: Playfair Display + Outfit)
- Backend: FastAPI + MongoDB + JWT custom auth
- Storage: base64-encoded images in MongoDB (client uploads via admin)

## Implemented
- **Backend (Feb 2026)**: JWT auth (customer+admin), brute-force lockout, Products/Categories/Orders/Invoices/Discounts/Customers/Settings CRUD, dashboard stats, WhatsApp URL builder, admin first-setup enforcement
- **Custom UI Components**: ClickSpark, Stack (photo-stack gallery), GooeyNav (with SVG gooey filter), MobileDock (framer-motion magnify)
- **Customer**: Home, Products (search/filter/sort), Product Detail (Stack gallery ≥3 images), Cart, Checkout (WA auto-open), Login/Register/ForgotPassword, Profile, Orders
- **Admin**: Login → First Setup, Dashboard (Recharts 14d/30d/12m), Products CRUD, Categories, Discounts/Vouchers, Inventory (low stock), Orders (status + convert to invoice), Invoices (CRUD + print + WhatsApp send), Customers list, Settings (business info, WA template editor)
- **Seed**: 6 fashion categories (Baju, Celana, Aksesoris, Sepatu, Tas, Jaket & Outer), default admin, default settings with WA +6288211118394

## Personas
- Guest: browse products, add to cart, checkout via WA
- Registered customer: order history, saved profile, address
- Single admin: full store management

## Next Action Items / Backlog
- P1: Server-side image upload endpoint (currently base64 stored in Mongo — works for small stores)
- P1: Email delivery for password reset (currently logs to console)
- P2: PDF export button (currently uses browser print → save as PDF)
- P2: CSV export for reports on Dashboard
- P2: Order status changes trigger WhatsApp notification
