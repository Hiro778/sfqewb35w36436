"""Shared fixtures for backend tests."""
import os
import sys
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load backend env so we can talk to Mongo for reset
load_dotenv(Path(__file__).parent.parent / ".env")

from pymongo import MongoClient  # noqa: E402
import bcrypt  # noqa: E402

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback to frontend .env
    for line in (Path(__file__).parent.parent.parent / "frontend" / ".env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_url():
    return API


@pytest.fixture(scope="session")
def db():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME]


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def reset_admin_state(db):
    """Ensure admin is in fresh 'first_setup_done=false' state before the suite runs.
    Also clean any prior TEST_ data."""
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
    # Clean any leftover test data
    db.users.delete_many({"email": {"$regex": "@hazzeon\\.io$"}})
    db.products.delete_many({"name": {"$regex": "^TEST_"}})
    db.categories.delete_many({"name": {"$regex": "^TEST_"}})
    db.discounts.delete_many({"code": {"$regex": "^TEST"}})
    db.invoices.delete_many({"customer_name": {"$regex": "^TEST_"}})
    db.orders.delete_many({"customer_name": {"$regex": "^TEST_"}})
    yield
    # teardown: leave admin in first_setup_done=True but with default username 'admin'
    # so any manual verification can proceed
