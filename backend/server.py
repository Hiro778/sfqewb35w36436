"""
Hazze'On Commerce - FastAPI Backend
Single-admin e-commerce with WhatsApp checkout for Indonesian SME (fashion retail).
"""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import bcrypt
import jwt
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status, Query
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "hazzeon-super-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day session
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "1234"

app = FastAPI(title="Hazze'On Commerce API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("hazzeon")


# ------------------------------------------------------------------
# Utility
# ------------------------------------------------------------------
def now_utc():
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": now_utc() + timedelta(minutes=ACCESS_TTL_MIN),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def clean_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


# ------------------------------------------------------------------
# Auth Dependencies
# ------------------------------------------------------------------
async def get_current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(401, "User not found")
    return clean_doc(user)


async def require_customer(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "customer":
        raise HTTPException(403, "Customer access required")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user


# ------------------------------------------------------------------
# Brute Force
# ------------------------------------------------------------------
MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


async def check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return
    locked_until = rec.get("locked_until")
    if locked_until:
        lu = datetime.fromisoformat(locked_until) if isinstance(locked_until, str) else locked_until
        if lu > now_utc():
            mins = int((lu - now_utc()).total_seconds() / 60) + 1
            raise HTTPException(429, f"Too many failed attempts. Try again in {mins} minutes.")


async def register_failed(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec["count"] if rec else 0) + 1
    update = {"count": count, "last_attempt": iso(now_utc())}
    if count >= MAX_ATTEMPTS:
        update["locked_until"] = iso(now_utc() + timedelta(minutes=LOCK_MINUTES))
        update["count"] = 0
    await db.login_attempts.update_one(
        {"identifier": identifier}, {"$set": update}, upsert=True
    )


async def clear_failed(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ------------------------------------------------------------------
# Models (Pydantic)
# ------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class AdminLoginIn(BaseModel):
    username: str
    password: str


class AdminFirstSetupIn(BaseModel):
    current_username: str
    current_password: str
    new_username: str = Field(min_length=3)
    new_password: str = Field(min_length=6)
    new_email: EmailStr
    new_phone: str


class CategoryIn(BaseModel):
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""


class ProductIn(BaseModel):
    name: str
    description: Optional[str] = ""
    category_id: str
    price: float
    discount_price: Optional[float] = None
    sku: Optional[str] = ""
    barcode: Optional[str] = ""
    stock: int = 0
    images: List[str] = []
    is_active: bool = True
    is_featured: bool = False


class OrderItemIn(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = ""


class OrderIn(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    notes: Optional[str] = ""
    items: List[OrderItemIn]
    voucher_code: Optional[str] = None


class DiscountIn(BaseModel):
    code: str
    description: Optional[str] = ""
    discount_type: str  # "percentage" | "fixed"
    value: float
    expiry_date: Optional[str] = None
    usage_limit: int = 0
    min_purchase: float = 0
    is_active: bool = True


class InvoiceIn(BaseModel):
    order_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    items: List[OrderItemIn]
    discount: float = 0
    tax: float = 0
    payment_status: str = "pending"
    notes: Optional[str] = ""


class InvoiceStatusIn(BaseModel):
    payment_status: str


class SettingsIn(BaseModel):
    business_name: Optional[str] = None
    logo: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    tiktok: Optional[str] = None
    currency: Optional[str] = None
    tax_rate: Optional[float] = None
    wa_message_template: Optional[str] = None


# ------------------------------------------------------------------
# Startup seed
# ------------------------------------------------------------------
DEFAULT_WA_TEMPLATE = """Halo *{business_name}*, saya ingin memesan:

*Order:* {order_number}
*Nama:* {customer_name}
*No HP:* {customer_phone}
*Alamat:* {customer_address}

*Produk:*
{product_list}

*Subtotal:* {subtotal}
*Diskon:* {discount}
*Total:* {total}

*Catatan:* {notes}

Mohon dibalas untuk konfirmasi & rekening transfer. Terima kasih 🙏"""


DEFAULT_CATEGORIES = [
    {"name": "Baju", "description": "Koleksi atasan pria & wanita"},
    {"name": "Celana", "description": "Celana panjang & pendek"},
    {"name": "Aksesoris", "description": "Aksesoris fashion"},
    {"name": "Sepatu", "description": "Sneakers, casual, formal"},
    {"name": "Tas", "description": "Tas selempang, ransel & handbag"},
    {"name": "Jaket & Outer", "description": "Jaket, hoodie & outerwear"},
]


async def seed_startup():
    # Indexes
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index("username", unique=True, sparse=True)
    await db.products.create_index("slug", unique=True, sparse=True)
    await db.categories.create_index("slug", unique=True, sparse=True)
    await db.orders.create_index("order_number", unique=True)
    await db.invoices.create_index("invoice_number", unique=True)
    await db.discounts.create_index("code", unique=True)

    # Default admin
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "username": DEFAULT_ADMIN_USERNAME,
            "email": None,
            "phone": None,
            "name": "Admin",
            "role": "admin",
            "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
            "first_setup_done": False,
            "created_at": iso(now_utc()),
        }
        await db.users.insert_one(admin_doc)
        log.info("Seeded default admin (admin/1234) - MUST change on first login.")

    # Default categories
    cat_count = await db.categories.count_documents({})
    if cat_count == 0:
        for i, c in enumerate(DEFAULT_CATEGORIES):
            slug = re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-")
            await db.categories.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "name": c["name"],
                    "slug": slug,
                    "description": c["description"],
                    "image": "",
                    "order": i,
                    "created_at": iso(now_utc()),
                }
            )
        log.info("Seeded default fashion categories.")

    # Default settings
    settings = await db.settings.find_one({"id": "global"})
    if not settings:
        await db.settings.insert_one(
            {
                "id": "global",
                "business_name": "Hazze'On Commerce",
                "logo": "",
                "whatsapp_number": "6288211118394",
                "email": "hello@hazzeon.id",
                "address": "Jakarta, Indonesia",
                "instagram": "",
                "facebook": "",
                "tiktok": "",
                "currency": "IDR",
                "tax_rate": 0.0,
                "wa_message_template": DEFAULT_WA_TEMPLATE,
                "updated_at": iso(now_utc()),
            }
        )
        log.info("Seeded default settings.")


@app.on_event("startup")
async def on_startup():
    await seed_startup()
    # write test credentials memo
    try:
        memdir = Path("/app/memory")
        memdir.mkdir(exist_ok=True, parents=True)
        (memdir / "test_credentials.md").write_text(
            "# Hazze'On Commerce - Test Credentials\n\n"
            "## Admin (First Login)\n"
            "- URL: /admin\n"
            "- username: `admin`\n"
            "- password: `1234`\n"
            "- Note: forced credential change on first login. After first setup, admin/1234 is permanently disabled.\n\n"
            "## Customer Test\n"
            "- Register a new customer at /register or use existing test if any.\n\n"
            "## Auth endpoints\n"
            "- POST /api/auth/register\n"
            "- POST /api/auth/login\n"
            "- POST /api/auth/logout\n"
            "- GET  /api/auth/me\n"
            "- POST /api/admin/login\n"
            "- POST /api/admin/first-setup\n"
        )
    except Exception as e:
        log.warning(f"failed to write test_credentials.md: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ==================================================================
# AUTH — CUSTOMER
# ==================================================================
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email sudah terdaftar")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": email,
        "phone": data.phone or "",
        "name": data.name,
        "role": "customer",
        "password_hash": hash_password(data.password),
        "address": "",
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(doc)
    token = create_token(uid, "customer")
    return {"token": token, "user": clean_doc(doc)}


@api.post("/auth/login")
async def login(data: LoginIn, request: Request):
    email = data.email.lower()
    # Lockout by account (email) — resilient to k8s ingress rotating client IPs
    ident = f"customer:{email}"
    await check_lockout(ident)
    user = await db.users.find_one({"email": email, "role": "customer"})
    if not user or not verify_password(data.password, user["password_hash"]):
        await register_failed(ident)
        raise HTTPException(401, "Email atau password salah")
    await clear_failed(ident)
    token = create_token(user["id"], "customer")
    return {"token": token, "user": clean_doc(user)}


@api.post("/auth/logout")
async def logout():
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(data: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]})
    return clean_doc(fresh)


@api.put("/auth/change-password")
async def change_password(data: ChangePasswordIn, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not verify_password(data.current_password, full["password_hash"]):
        raise HTTPException(400, "Password lama salah")
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"ok": True}


@api.post("/auth/forgot-password")
async def forgot_password(data: ForgotIn):
    user = await db.users.find_one({"email": data.email.lower(), "role": "customer"})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one(
            {
                "id": str(uuid.uuid4()),
                "token": token,
                "user_id": user["id"],
                "expires_at": iso(now_utc() + timedelta(hours=1)),
                "used": False,
            }
        )
        # Token is stored in DB; delivery via email should be integrated by ops.
    return {"ok": True, "message": "Jika email terdaftar, link reset password akan dikirim."}


@api.post("/auth/reset-password")
async def reset_password(data: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": data.token, "used": False})
    if not rec:
        raise HTTPException(400, "Token tidak valid")
    expires_at = datetime.fromisoformat(rec["expires_at"])
    if expires_at < now_utc():
        raise HTTPException(400, "Token kadaluarsa")
    await db.users.update_one(
        {"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(data.password)}}
    )
    await db.password_reset_tokens.update_one({"token": data.token}, {"$set": {"used": True}})
    return {"ok": True}


# ==================================================================
# AUTH — ADMIN
# ==================================================================
@api.post("/admin/login")
async def admin_login(data: AdminLoginIn, request: Request):
    # Lockout by username — resilient to k8s ingress IP rotation
    ident = f"admin:{data.username}"
    await check_lockout(ident)
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        raise HTTPException(500, "Admin not initialized")

    # If first setup done, default credentials must NEVER work again
    if admin.get("first_setup_done"):
        if data.username == DEFAULT_ADMIN_USERNAME and data.password == DEFAULT_ADMIN_PASSWORD:
            await register_failed(ident)
            raise HTTPException(401, "Kredensial admin/1234 telah dinonaktifkan.")
        # Real credentials: verify against stored username & password_hash
        if data.username != admin.get("username") or not verify_password(
            data.password, admin["password_hash"]
        ):
            await register_failed(ident)
            raise HTTPException(401, "Username atau password salah")
    else:
        # First setup not done: only default credentials work
        if data.username != DEFAULT_ADMIN_USERNAME or data.password != DEFAULT_ADMIN_PASSWORD:
            await register_failed(ident)
            raise HTTPException(401, "Username atau password salah")

    await clear_failed(ident)
    token = create_token(admin["id"], "admin")
    return {
        "token": token,
        "user": clean_doc(admin),
        "requires_first_setup": not admin.get("first_setup_done", False),
    }


@api.post("/admin/first-setup")
async def admin_first_setup(data: AdminFirstSetupIn, user: dict = Depends(require_admin)):
    admin = await db.users.find_one({"id": user["id"]})
    if admin.get("first_setup_done"):
        raise HTTPException(400, "First setup sudah dilakukan.")
    # Verify current credentials (must be default)
    if data.current_username != DEFAULT_ADMIN_USERNAME or data.current_password != DEFAULT_ADMIN_PASSWORD:
        raise HTTPException(401, "Kredensial saat ini salah.")
    if not verify_password(data.current_password, admin["password_hash"]):
        raise HTTPException(401, "Kredensial default sudah tidak berlaku.")

    # Ensure new username is not the default
    if data.new_username == DEFAULT_ADMIN_USERNAME:
        raise HTTPException(400, "Username baru tidak boleh sama dengan default.")

    await db.users.update_one(
        {"id": admin["id"]},
        {
            "$set": {
                "username": data.new_username,
                "email": data.new_email.lower(),
                "phone": data.new_phone,
                "password_hash": hash_password(data.new_password),
                "first_setup_done": True,
                "updated_at": iso(now_utc()),
            }
        },
    )
    return {"ok": True}


# ==================================================================
# CATEGORIES
# ==================================================================
@api.get("/categories")
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return cats


@api.post("/categories")
async def create_category(data: CategoryIn, user: dict = Depends(require_admin)):
    slug = re.sub(r"[^a-z0-9]+", "-", data.name.lower()).strip("-")
    existing = await db.categories.find_one({"slug": slug})
    if existing:
        raise HTTPException(400, "Kategori dengan nama serupa sudah ada")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "image": data.image,
        "order": await db.categories.count_documents({}),
        "created_at": iso(now_utc()),
    }
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryIn, user: dict = Depends(require_admin)):
    slug = re.sub(r"[^a-z0-9]+", "-", data.name.lower()).strip("-")
    await db.categories.update_one(
        {"id": cat_id},
        {"$set": {"name": data.name, "slug": slug, "description": data.description, "image": data.image}},
    )
    fresh = await db.categories.find_one({"id": cat_id}, {"_id": 0})
    if not fresh:
        raise HTTPException(404, "Kategori tidak ditemukan")
    return fresh


@api.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, user: dict = Depends(require_admin)):
    used = await db.products.count_documents({"category_id": cat_id})
    if used > 0:
        raise HTTPException(400, f"Kategori masih dipakai {used} produk. Hapus/pindahkan produk dulu.")
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


# ==================================================================
# PRODUCTS
# ==================================================================
def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:6]}"


@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = "newest",
    featured: Optional[bool] = None,
    on_sale: Optional[bool] = None,
    limit: int = 60,
    skip: int = 0,
    include_inactive: bool = False,
    user_role: Optional[str] = None,
):
    query: dict = {}
    if not include_inactive:
        query["is_active"] = True
    if q:
        query["name"] = {"$regex": re.escape(q), "$options": "i"}
    if category:
        query["category_id"] = category
    if featured:
        query["is_featured"] = True
    if on_sale:
        query["discount_price"] = {"$gt": 0}

    sort_field = [("created_at", -1)]
    if sort == "price-asc":
        sort_field = [("price", 1)]
    elif sort == "price-desc":
        sort_field = [("price", -1)]
    elif sort == "popular":
        sort_field = [("sold_count", -1)]

    cursor = db.products.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    return items


@api.get("/products/{slug_or_id}")
async def get_product(slug_or_id: str):
    prod = await db.products.find_one(
        {"$or": [{"slug": slug_or_id}, {"id": slug_or_id}]}, {"_id": 0}
    )
    if not prod:
        raise HTTPException(404, "Produk tidak ditemukan")
    return prod


@api.get("/admin/products")
async def admin_list_products(user: dict = Depends(require_admin)):
    items = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.post("/admin/products")
async def create_product(data: ProductIn, user: dict = Depends(require_admin)):
    cat = await db.categories.find_one({"id": data.category_id})
    if not cat:
        raise HTTPException(400, "Kategori tidak valid")
    doc = data.dict()
    doc.update(
        {
            "id": str(uuid.uuid4()),
            "slug": _slugify(data.name),
            "sold_count": 0,
            "created_at": iso(now_utc()),
            "updated_at": iso(now_utc()),
        }
    )
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/products/{pid}")
async def update_product(pid: str, data: ProductIn, user: dict = Depends(require_admin)):
    updates = data.dict()
    updates["updated_at"] = iso(now_utc())
    res = await db.products.update_one({"id": pid}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(404, "Produk tidak ditemukan")
    fresh = await db.products.find_one({"id": pid}, {"_id": 0})
    return fresh


@api.delete("/admin/products/{pid}")
async def delete_product(pid: str, user: dict = Depends(require_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# ==================================================================
# ORDERS
# ==================================================================
async def _gen_order_number() -> str:
    today = now_utc().strftime("%Y%m%d")
    count = await db.orders.count_documents({"order_number": {"$regex": f"^ORD-{today}"}})
    return f"ORD-{today}-{count + 1:04d}"


async def _gen_invoice_number() -> str:
    today = now_utc().strftime("%Y%m%d")
    count = await db.invoices.count_documents({"invoice_number": {"$regex": f"^INV-{today}"}})
    return f"INV-{today}-{count + 1:04d}"


@api.post("/orders")
async def create_order(data: OrderIn, request: Request):
    # customer optional (guest checkout allowed)
    customer_id = None
    try:
        u = await get_current_user(request)
        customer_id = u["id"]
    except Exception:
        pass

    # SECURITY: re-fetch canonical product data from DB. Never trust client-supplied prices.
    trusted_items: List[dict] = []
    for i in data.items:
        prod = await db.products.find_one({"id": i.product_id})
        if not prod:
            raise HTTPException(400, f"Produk {i.name} tidak ditemukan")
        canonical_price = (
            prod["discount_price"]
            if prod.get("discount_price") and 0 < prod["discount_price"] < prod["price"]
            else prod["price"]
        )
        trusted_items.append(
            {
                "product_id": prod["id"],
                "name": prod["name"],
                "price": float(canonical_price),
                "quantity": int(i.quantity),
                "image": (prod.get("images") or [""])[0] if prod.get("images") else "",
            }
        )

    subtotal = sum(i["price"] * i["quantity"] for i in trusted_items)
    discount_amount = 0.0
    voucher_applied = None

    if data.voucher_code:
        vc = await db.discounts.find_one({"code": data.voucher_code.upper(), "is_active": True})
        if vc:
            expiry = vc.get("expiry_date")
            valid = True
            if expiry:
                try:
                    if datetime.fromisoformat(expiry) < now_utc():
                        valid = False
                except Exception:
                    pass
            if vc.get("usage_limit", 0) > 0 and vc.get("used_count", 0) >= vc["usage_limit"]:
                valid = False
            if subtotal < vc.get("min_purchase", 0):
                valid = False
            if valid:
                if vc["discount_type"] == "percentage":
                    discount_amount = subtotal * (vc["value"] / 100)
                else:
                    discount_amount = min(vc["value"], subtotal)
                voucher_applied = vc["code"]
                await db.discounts.update_one({"id": vc["id"]}, {"$inc": {"used_count": 1}})

    total = max(0, subtotal - discount_amount)

    order_no = await _gen_order_number()
    doc = {
        "id": str(uuid.uuid4()),
        "order_number": order_no,
        "customer_id": customer_id,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_address": data.customer_address,
        "notes": data.notes,
        "items": trusted_items,
        "subtotal": subtotal,
        "discount": discount_amount,
        "voucher_code": voucher_applied,
        "total": total,
        "status": "pending",
        "invoice_id": None,
        "created_at": iso(now_utc()),
    }
    await db.orders.insert_one(doc)

    # increment sold count based on trusted items
    for i in trusted_items:
        await db.products.update_one({"id": i["product_id"]}, {"$inc": {"sold_count": i["quantity"]}})

    doc.pop("_id", None)
    return doc


@api.get("/orders/my")
async def my_orders(user: dict = Depends(require_customer)):
    items = (
        await db.orders.find({"customer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    )
    return items


@api.get("/admin/orders")
async def admin_list_orders(user: dict = Depends(require_admin)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.get("/admin/orders/{oid}")
async def admin_get_order(oid: str, user: dict = Depends(require_admin)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order tidak ditemukan")
    return o


@api.put("/admin/orders/{oid}/status")
async def admin_update_order_status(oid: str, body: dict, user: dict = Depends(require_admin)):
    status_val = body.get("status")
    if status_val not in ["pending", "completed", "cancelled"]:
        raise HTTPException(400, "Status tidak valid")
    await db.orders.update_one({"id": oid}, {"$set": {"status": status_val}})
    return {"ok": True}


@api.delete("/admin/orders/{oid}")
async def admin_delete_order(oid: str, user: dict = Depends(require_admin)):
    await db.orders.delete_one({"id": oid})
    return {"ok": True}


# ==================================================================
# INVOICES
# ==================================================================
@api.get("/admin/invoices")
async def admin_list_invoices(q: Optional[str] = None, user: dict = Depends(require_admin)):
    query: dict = {}
    if q:
        query["$or"] = [
            {"invoice_number": {"$regex": re.escape(q), "$options": "i"}},
            {"customer_name": {"$regex": re.escape(q), "$options": "i"}},
            {"customer_phone": {"$regex": re.escape(q), "$options": "i"}},
        ]
    items = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.get("/admin/invoices/{iid}")
async def admin_get_invoice(iid: str, user: dict = Depends(require_admin)):
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice tidak ditemukan")
    return inv


@api.get("/invoices/{iid}/public")
async def public_get_invoice(iid: str):
    """Read-only public invoice access for print/PDF pages."""
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice tidak ditemukan")
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return {"invoice": inv, "settings": settings}


@api.post("/admin/invoices")
async def create_invoice(data: InvoiceIn, user: dict = Depends(require_admin)):
    subtotal = sum(i.price * i.quantity for i in data.items)
    grand_total = max(0, subtotal - data.discount + data.tax)
    inv_no = await _gen_invoice_number()
    doc = {
        "id": str(uuid.uuid4()),
        "invoice_number": inv_no,
        "order_id": data.order_id,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "items": [i.dict() for i in data.items],
        "subtotal": subtotal,
        "discount": data.discount,
        "tax": data.tax,
        "grand_total": grand_total,
        "payment_status": data.payment_status,
        "notes": data.notes,
        "created_at": iso(now_utc()),
        "updated_at": iso(now_utc()),
    }
    await db.invoices.insert_one(doc)
    if data.order_id:
        await db.orders.update_one({"id": data.order_id}, {"$set": {"invoice_id": doc["id"]}})
    doc.pop("_id", None)
    return doc


@api.put("/admin/invoices/{iid}")
async def update_invoice(iid: str, data: InvoiceIn, user: dict = Depends(require_admin)):
    subtotal = sum(i.price * i.quantity for i in data.items)
    grand_total = max(0, subtotal - data.discount + data.tax)
    updates = {
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "items": [i.dict() for i in data.items],
        "subtotal": subtotal,
        "discount": data.discount,
        "tax": data.tax,
        "grand_total": grand_total,
        "payment_status": data.payment_status,
        "notes": data.notes,
        "updated_at": iso(now_utc()),
    }
    res = await db.invoices.update_one({"id": iid}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(404, "Invoice tidak ditemukan")
    return await db.invoices.find_one({"id": iid}, {"_id": 0})


@api.put("/admin/invoices/{iid}/status")
async def update_invoice_status(iid: str, body: InvoiceStatusIn, user: dict = Depends(require_admin)):
    if body.payment_status not in ["pending", "paid", "cancelled", "refund"]:
        raise HTTPException(400, "Status tidak valid")
    await db.invoices.update_one(
        {"id": iid}, {"$set": {"payment_status": body.payment_status, "updated_at": iso(now_utc())}}
    )
    return {"ok": True}


@api.delete("/admin/invoices/{iid}")
async def delete_invoice(iid: str, user: dict = Depends(require_admin)):
    await db.invoices.delete_one({"id": iid})
    return {"ok": True}


# ==================================================================
# DISCOUNTS
# ==================================================================
@api.get("/admin/discounts")
async def list_discounts(user: dict = Depends(require_admin)):
    items = await db.discounts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.post("/admin/discounts")
async def create_discount(data: DiscountIn, user: dict = Depends(require_admin)):
    if data.discount_type not in ["percentage", "fixed"]:
        raise HTTPException(400, "Tipe diskon harus percentage atau fixed")
    code = data.code.upper()
    exists = await db.discounts.find_one({"code": code})
    if exists:
        raise HTTPException(400, "Kode diskon sudah ada")
    doc = data.dict()
    doc["code"] = code
    doc.update(
        {"id": str(uuid.uuid4()), "used_count": 0, "created_at": iso(now_utc())}
    )
    await db.discounts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/discounts/{did}")
async def update_discount(did: str, data: DiscountIn, user: dict = Depends(require_admin)):
    updates = data.dict()
    updates["code"] = updates["code"].upper()
    res = await db.discounts.update_one({"id": did}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(404, "Diskon tidak ditemukan")
    return await db.discounts.find_one({"id": did}, {"_id": 0})


@api.delete("/admin/discounts/{did}")
async def delete_discount(did: str, user: dict = Depends(require_admin)):
    await db.discounts.delete_one({"id": did})
    return {"ok": True}


@api.post("/discounts/validate")
async def validate_discount(body: dict):
    code = (body.get("code") or "").upper()
    subtotal = float(body.get("subtotal") or 0)
    vc = await db.discounts.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not vc:
        raise HTTPException(404, "Kode voucher tidak valid")
    if vc.get("expiry_date"):
        try:
            if datetime.fromisoformat(vc["expiry_date"]) < now_utc():
                raise HTTPException(400, "Voucher sudah kadaluarsa")
        except HTTPException:
            raise
        except Exception:
            pass
    if vc.get("usage_limit", 0) > 0 and vc.get("used_count", 0) >= vc["usage_limit"]:
        raise HTTPException(400, "Voucher sudah habis digunakan")
    if subtotal < vc.get("min_purchase", 0):
        raise HTTPException(400, f"Minimum pembelian Rp{int(vc['min_purchase']):,}")
    if vc["discount_type"] == "percentage":
        amount = subtotal * (vc["value"] / 100)
    else:
        amount = min(vc["value"], subtotal)
    return {"code": vc["code"], "discount": amount, "type": vc["discount_type"], "value": vc["value"]}


# ==================================================================
# CUSTOMERS (admin)
# ==================================================================
@api.get("/admin/customers")
async def admin_list_customers(user: dict = Depends(require_admin)):
    items = await db.users.find(
        {"role": "customer"}, {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).to_list(1000)
    # attach order count
    for c in items:
        c["order_count"] = await db.orders.count_documents({"customer_id": c["id"]})
    return items


# ==================================================================
# SETTINGS
# ==================================================================
@api.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        raise HTTPException(500, "Settings not initialized")
    return s


@api.put("/admin/settings")
async def update_settings(data: SettingsIn, user: dict = Depends(require_admin)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    updates["updated_at"] = iso(now_utc())
    await db.settings.update_one({"id": "global"}, {"$set": updates})
    return await db.settings.find_one({"id": "global"}, {"_id": 0})


# ==================================================================
# DASHBOARD STATS
# ==================================================================
@api.get("/admin/dashboard")
async def dashboard(user: dict = Depends(require_admin)):
    now = now_utc()
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = start_today - timedelta(days=start_today.weekday())
    start_month = start_today.replace(day=1)
    start_year = start_today.replace(month=1, day=1)

    def rng_query(start: datetime, end: Optional[datetime] = None) -> dict:
        q: dict = {"created_at": {"$gte": iso(start)}}
        if end:
            q["created_at"]["$lt"] = iso(end)
        return q

    async def sum_grand_total(query: dict) -> float:
        # sum from invoices where payment_status == paid
        query = {**query, "payment_status": "paid"}
        pipe = [
            {"$match": query},
            {"$group": {"_id": None, "total": {"$sum": "$grand_total"}}},
        ]
        cur = db.invoices.aggregate(pipe)
        async for row in cur:
            return float(row.get("total") or 0)
        return 0.0

    revenue_today = await sum_grand_total(rng_query(start_today))
    revenue_week = await sum_grand_total(rng_query(start_week))
    revenue_month = await sum_grand_total(rng_query(start_month))
    revenue_year = await sum_grand_total(rng_query(start_year))

    orders_pending = await db.orders.count_documents({"status": "pending"})
    orders_completed = await db.orders.count_documents({"status": "completed"})
    orders_cancelled = await db.orders.count_documents({"status": "cancelled"})
    orders_total = await db.orders.count_documents({})

    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)

    # revenue chart last 14 days
    days_series = []
    for i in range(13, -1, -1):
        d = (start_today - timedelta(days=i))
        d_end = d + timedelta(days=1)
        rev = await sum_grand_total({"created_at": {"$gte": iso(d), "$lt": iso(d_end)}})
        days_series.append({"date": d.strftime("%d %b"), "revenue": rev})

    # revenue chart last 30 days
    days_30 = []
    for i in range(29, -1, -1):
        d = (start_today - timedelta(days=i))
        d_end = d + timedelta(days=1)
        rev = await sum_grand_total({"created_at": {"$gte": iso(d), "$lt": iso(d_end)}})
        days_30.append({"date": d.strftime("%d/%m"), "revenue": rev})

    # revenue chart last 12 months
    months = []
    y, m = start_today.year, start_today.month
    seq: List[tuple] = []
    for _ in range(12):
        seq.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    seq.reverse()
    for (yy, mm) in seq:
        month_start = datetime(yy, mm, 1, tzinfo=timezone.utc)
        # end of month
        if mm == 12:
            next_month = datetime(yy + 1, 1, 1, tzinfo=timezone.utc)
        else:
            next_month = datetime(yy, mm + 1, 1, tzinfo=timezone.utc)
        rev = await sum_grand_total(
            {"created_at": {"$gte": iso(month_start), "$lt": iso(next_month)}}
        )
        months.append({"date": month_start.strftime("%b %y"), "revenue": rev})

    # best selling products
    best_selling = await db.products.find({}, {"_id": 0}).sort("sold_count", -1).limit(5).to_list(5)

    # low stock
    low_stock = (
        await db.products.find({"stock": {"$lte": 5}, "is_active": True}, {"_id": 0})
        .sort("stock", 1)
        .limit(10)
        .to_list(10)
    )

    total_customers = await db.users.count_documents({"role": "customer"})
    total_products = await db.products.count_documents({})

    return {
        "revenue": {
            "today": revenue_today,
            "week": revenue_week,
            "month": revenue_month,
            "year": revenue_year,
        },
        "orders": {
            "pending": orders_pending,
            "completed": orders_completed,
            "cancelled": orders_cancelled,
            "total": orders_total,
        },
        "totals": {
            "customers": total_customers,
            "products": total_products,
        },
        "recent_orders": recent_orders,
        "chart_14d": days_series,
        "chart_30d": days_30,
        "chart_12m": months,
        "best_selling": best_selling,
        "low_stock": low_stock,
    }


# ==================================================================
# WHATSAPP MESSAGE BUILDER
# ==================================================================
@api.post("/whatsapp/build")
async def build_wa_message(body: dict):
    """Given order data + settings, produce the wa.me url."""
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    template = settings.get("wa_message_template") or DEFAULT_WA_TEMPLATE
    wa_number = settings.get("whatsapp_number") or ""

    def fmt_currency(v: float) -> str:
        return "Rp" + f"{int(v):,}".replace(",", ".")

    product_list = "\n".join(
        f"- {i['name']} x{i['quantity']}  {fmt_currency(i['price'] * i['quantity'])}"
        for i in body.get("items", [])
    )

    msg = template.format(
        business_name=settings.get("business_name") or "",
        customer_name=body.get("customer_name") or "",
        customer_phone=body.get("customer_phone") or "",
        customer_address=body.get("customer_address") or "",
        order_number=body.get("order_number") or "",
        product_list=product_list,
        subtotal=fmt_currency(body.get("subtotal") or 0),
        discount=fmt_currency(body.get("discount") or 0),
        total=fmt_currency(body.get("total") or 0),
        notes=body.get("notes") or "-",
    )
    from urllib.parse import quote
    return {"wa_url": f"https://wa.me/{wa_number}?text={quote(msg)}", "message": msg}


# ==================================================================
# HEALTH
# ==================================================================
@api.get("/")
async def root():
    return {"service": "Hazze'On Commerce", "status": "ok"}


# Mount router
app.include_router(api)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
