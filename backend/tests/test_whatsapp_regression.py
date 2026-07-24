"""
Regression tests for the WhatsApp URL normalization fix.

The bug: WhatsApp checkout link 404'd because generated URL used a broken
'api.whatsapp.com/resolve/?deeplink=...' pattern with double-encoded chars.
Root cause: phone from settings (or customer form) contained '+', spaces, hyphens.
Fix: normalize_phone (backend) strips non-digits and prefixes leading 0 -> 62,
then encodes the message exactly once via urllib.parse.quote(msg, safe='').

These tests target /api/whatsapp/build and validate:
    1. Canonical wa.me host (never api.whatsapp.com/resolve)
    2. Phone segment is digits-only (no '+', spaces, hyphens)
    3. Text portion is SINGLE-encoded (no %2520, no %250A)
"""
import os
import re
import pytest
import requests
import bcrypt
from pathlib import Path
from pymongo import MongoClient
from urllib.parse import urlparse, parse_qs, unquote
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    for line in (Path(__file__).parent.parent.parent / "frontend" / ".env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
API = f"{BASE_URL.rstrip('/')}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

DEFAULT_WA = "6288211118394"


@pytest.fixture(scope="session")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api_client, db):
    """Reset admin to admin/1234 first-setup, complete first-setup, return admin JWT."""
    # Reset to fresh state
    db.users.update_one(
        {"role": "admin"},
        {
            "$set": {
                "username": "admin",
                "email": None,
                "phone": None,
                "password_hash": bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode(),
                "first_setup_done": False,
            }
        },
    )
    db.login_attempts.delete_many({})

    # Login with default
    r = api_client.post(f"{API}/admin/login", json={"username": "admin", "password": "1234"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    assert r.json().get("requires_first_setup") is True

    # First setup
    r = api_client.post(
        f"{API}/admin/first-setup",
        headers={"Authorization": f"Bearer {tok}"},
        json={
            "current_username": "admin",
            "current_password": "1234",
            "new_username": "waadmin",
            "new_password": "waSecret1",
            "new_email": "wa@test.com",
            "new_phone": "628123",
        },
    )
    assert r.status_code == 200, r.text

    # Login as new admin
    r = api_client.post(f"{API}/admin/login", json={"username": "waadmin", "password": "waSecret1"})
    assert r.status_code == 200, r.text
    yield r.json()["token"]

    # Teardown: reset admin so /admin/login with admin/1234 works again
    db.users.update_one(
        {"role": "admin"},
        {
            "$set": {
                "username": "admin",
                "email": None,
                "phone": None,
                "password_hash": bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode(),
                "first_setup_done": False,
            }
        },
    )
    db.login_attempts.delete_many({})
    # Restore default WA number in case a test forgot to
    db.settings.update_one(
        {"id": "global"}, {"$set": {"whatsapp_number": DEFAULT_WA}}, upsert=False
    )


def _set_wa_number(api_client, admin_token, number):
    r = api_client.put(
        f"{API}/admin/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"whatsapp_number": number},
    )
    assert r.status_code == 200, r.text


def _sample_order_body():
    return {
        "order_number": "ORD-20260101-0001",
        "customer_name": "John Doe",
        "customer_phone": "+62 812 3456 7890",
        "customer_address": "Jl. Merdeka 1",
        "notes": "handle care",
        "items": [
            {"product_id": "p1", "name": "Kaos", "price": 100000, "quantity": 2, "image": ""},
        ],
        "subtotal": 200000,
        "discount": 0,
        "total": 200000,
    }


def _assert_canonical(wa_url, expected_digits):
    """Assert URL is a canonical wa.me link with digits-only phone and single-encoded text."""
    # (1) Structure
    assert wa_url.startswith(f"https://wa.me/{expected_digits}"), (
        f"URL should start with 'https://wa.me/{expected_digits}', got: {wa_url}"
    )
    # (2) Host is wa.me, not api.whatsapp.com/resolve
    assert "api.whatsapp.com/resolve" not in wa_url
    assert "deeplink=" not in wa_url

    parsed = urlparse(wa_url)
    assert parsed.scheme == "https"
    assert parsed.netloc == "wa.me"

    # (3) Phone segment digits-only
    phone_segment = parsed.path.lstrip("/")
    assert phone_segment == expected_digits
    assert re.match(r"^\d+$", phone_segment), f"phone must be digits-only: {phone_segment}"
    assert "+" not in phone_segment
    assert " " not in phone_segment
    assert "-" not in phone_segment

    # (4) Text is single-encoded
    if "?text=" in wa_url:
        raw_query = wa_url.split("?text=", 1)[1]
        # No double encoding: %2520 = %20 encoded twice; %250A = %0A encoded twice
        assert "%2520" not in raw_query, "text is double-encoded (found %2520)"
        assert "%250A" not in raw_query, "text is double-encoded (found %250A)"
        assert "%252A" not in raw_query, "text is double-encoded (found %252A)"


class TestWhatsAppUrlBuilding:
    """Regression tests for POST /api/whatsapp/build."""

    def test_messy_phone_plus_spaces_hyphens(self, api_client, admin_token):
        """The famous case from the bug report."""
        _set_wa_number(api_client, admin_token, "+62 882-8936-6448   ")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200, r.text
        wa_url = r.json()["wa_url"]
        assert wa_url.startswith("https://wa.me/6288289366448?text=")
        _assert_canonical(wa_url, "6288289366448")

    def test_leading_zero_indonesia(self, api_client, admin_token):
        """0888-1234-5678 -> 62 88812345678."""
        _set_wa_number(api_client, admin_token, "0888-1234-5678")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200
        wa_url = r.json()["wa_url"]
        _assert_canonical(wa_url, "6288812345678")

    def test_plus_prefix_with_hyphens(self, api_client, admin_token):
        """+6288-2811-1839-4 -> 6288281118394."""
        _set_wa_number(api_client, admin_token, "+6288-2811-1839-4")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200
        wa_url = r.json()["wa_url"]
        _assert_canonical(wa_url, "6288281118394")

    def test_parens_and_spaces(self, api_client, admin_token):
        """(0812) 345 6789 -> 628123456789."""
        _set_wa_number(api_client, admin_token, "(0812) 345 6789")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200
        wa_url = r.json()["wa_url"]
        _assert_canonical(wa_url, "628123456789")

    def test_pure_digits_with_spaces(self, api_client, admin_token):
        """'628828111 8394' -> 6288281118394 (space is only non-digit)."""
        _set_wa_number(api_client, admin_token, "628828111 8394")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200
        wa_url = r.json()["wa_url"]
        _assert_canonical(wa_url, "6288281118394")

    def test_message_is_single_encoded(self, api_client, admin_token):
        """Verify the text query parameter can be decoded once to a valid string
        containing spaces, newlines, and asterisks (from the WA template)."""
        _set_wa_number(api_client, admin_token, "6288211118394")
        r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
        assert r.status_code == 200
        d = r.json()
        wa_url = d["wa_url"]
        raw_text = wa_url.split("?text=", 1)[1]

        # No double encoding artefacts
        assert "%2520" not in raw_text
        assert "%250A" not in raw_text
        assert "%252A" not in raw_text

        # Single decode should give the original message
        decoded = unquote(raw_text)
        assert decoded == d["message"]
        assert "\n" in decoded  # template contains newlines
        assert "*" in decoded  # template contains asterisks (bold markdown)
        assert "Hazze'On Commerce" in decoded

    def test_wa_url_never_uses_broken_resolve_pattern(self, api_client, admin_token):
        """Belt-and-braces: the broken pattern must never appear."""
        for messy in ["+62 882-8936-6448", "0812-3456-7890", "(0888) 111 2222"]:
            _set_wa_number(api_client, admin_token, messy)
            r = api_client.post(f"{API}/whatsapp/build", json=_sample_order_body())
            assert r.status_code == 200
            wa_url = r.json()["wa_url"]
            assert "api.whatsapp.com/resolve" not in wa_url
            assert "deeplink=" not in wa_url
            assert wa_url.startswith("https://wa.me/")
