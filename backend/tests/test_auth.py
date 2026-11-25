import os
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
import io
import json
from datetime import datetime, timedelta
from urllib.error import HTTPError, URLError

_test_directory = tempfile.TemporaryDirectory(prefix="myshopupdates-auth-")
_database_path = Path(_test_directory.name) / "auth-tests.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_database_path.as_posix()}"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text

from app.db.database import Base, SessionLocal, engine
from app.db.migrations import backup_database_if_needed, ensure_auth_schema
from app.main import app
from app.seed_admin import main as setup_admin
from app.models import Business, Customer, Product, Sale, Udhaar
from app.routers.coach import ollama_headers, ollama_settings


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def register(self, client: TestClient, email="owner@example.test"):
        return client.post(
            "/auth/register",
            json={"name": "Shop Owner", "email": email, "password": "good-password-123"},
        )

    def create_shop(self, client: TestClient, csrf_token: str, name="My Shop"):
        return client.post(
            "/businesses/",
            headers={"X-CSRF-Token": csrf_token},
            json={"name": name, "owner_name": "Shop Owner", "opening_cash": 0},
        )

    def test_register_login_invalid_password_and_logout(self):
        registration = self.register(self.client)
        self.assertEqual(registration.status_code, 201, registration.text)
        auth = registration.json()
        self.assertEqual(auth["user"]["role"], "shop_owner")
        self.assertNotIn("password_hash", auth["user"])
        self.assertIn("httponly", registration.headers.get("set-cookie", "").lower())

        shop = self.create_shop(self.client, auth["csrf_token"])
        self.assertEqual(shop.status_code, 200, shop.text)
        shop_id = shop.json()["id"]

        self.assertEqual(self.client.get("/businesses/mine").json()[0]["id"], shop_id)
        self.assertEqual(
            self.client.post("/auth/logout", headers={"X-CSRF-Token": auth["csrf_token"]}).status_code,
            204,
        )
        self.assertEqual(self.client.get("/auth/me").status_code, 401)

        invalid = self.client.post(
            "/auth/login",
            json={"email": "owner@example.test", "password": "wrong-password"},
        )
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(invalid.json()["detail"], "Email or password is incorrect.")

        valid = self.client.post(
            "/auth/login",
            json={"email": "owner@example.test", "password": "good-password-123"},
        )
        self.assertEqual(valid.status_code, 200, valid.text)
        self.assertEqual(valid.json()["user"]["id"], auth["user"]["id"])

    def test_unauthorized_business_api_and_owner_isolation(self):
        self.assertEqual(self.client.get("/products/business/1").status_code, 401)

        first = TestClient(app)
        second = TestClient(app)
        try:
            first_auth = self.register(first, "one@example.test").json()
            second_auth = self.register(second, "two@example.test").json()
            first_shop = self.create_shop(first, first_auth["csrf_token"], "Shop One").json()
            second_shop = self.create_shop(second, second_auth["csrf_token"], "Shop Two").json()

            forbidden_read = first.get(f"/analytics/business/{second_shop['id']}")
            self.assertEqual(forbidden_read.status_code, 404)
            forbidden_write = first.post(
                "/products/",
                headers={"X-CSRF-Token": first_auth["csrf_token"]},
                json={
                    "business_id": second_shop["id"],
                    "name": "Intrusion",
                    "purchase_price": 1,
                    "selling_price": 2,
                },
            )
            self.assertEqual(forbidden_write.status_code, 404)
            own_read = first.get(f"/analytics/business/{first_shop['id']}")
            self.assertEqual(own_read.status_code, 200, own_read.text)
        finally:
            first.close()
            second.close()

    def test_only_admin_can_open_admin_dashboard(self):
        registered = self.register(self.client, "regular@example.test")
        self.assertEqual(registered.status_code, 201)
        self.assertEqual(self.client.get("/admin/overview").status_code, 403)

        with patch("builtins.input", side_effect=["Admin", "admin@example.test"]), patch(
            "app.seed_admin.getpass",
            side_effect=["admin-password-123", "admin-password-123"],
        ):
            setup_admin()

        with self.assertRaises(SystemExit):
            with patch("builtins.input", side_effect=["Second Admin", "second@example.test"]), patch(
                "app.seed_admin.getpass",
                side_effect=["another-password-123", "another-password-123"],
            ):
                setup_admin()

        admin_client = TestClient(app)
        try:
            login = admin_client.post(
                "/auth/login",
                json={"email": "admin@example.test", "password": "admin-password-123"},
            )
            self.assertEqual(login.status_code, 200, login.text)
            self.assertEqual(login.json()["user"]["role"], "admin")
            self.assertEqual(admin_client.get("/admin/overview").status_code, 200)
        finally:
            admin_client.close()

    def test_additive_migration_keeps_existing_business_rows(self):
        with tempfile.TemporaryDirectory(prefix="myshopupdates-legacy-") as directory:
            legacy_engine = create_engine(f"sqlite:///{Path(directory, 'legacy.db').as_posix()}")
            try:
                with legacy_engine.begin() as connection:
                    connection.execute(text("CREATE TABLE businesses (id INTEGER PRIMARY KEY, name TEXT NOT NULL)"))
                    connection.execute(text("INSERT INTO businesses (id, name) VALUES (7, 'Legacy Shop')"))
                backup = backup_database_if_needed(legacy_engine)
                self.assertIsNotNone(backup)
                self.assertTrue(backup.is_file())
                ensure_auth_schema(legacy_engine)
                columns = {column["name"] for column in inspect(legacy_engine).get_columns("businesses")}
                self.assertIn("owner_user_id", columns)
                with legacy_engine.connect() as connection:
                    record = connection.execute(text("SELECT id, name, owner_user_id FROM businesses WHERE id = 7")).one()
                self.assertEqual(tuple(record), (7, "Legacy Shop", None))
            finally:
                legacy_engine.dispose()

    def test_coach_uses_only_authenticated_shop_data_and_handles_ollama(self):
        registration = self.register(self.client, "coach-owner@example.test")
        auth = registration.json()
        shop = self.create_shop(self.client, auth["csrf_token"], "Coach Test Shop").json()
        with SessionLocal() as db:
            business = db.get(Business, shop["id"])
            customer = Customer(business_id=shop["id"], name="Private Customer", phone="9876543210", total_due=75)
            product = Product(
                business_id=shop["id"], name="Actual Rice", category="Grain",
                purchase_price=20, selling_price=30, stock_quantity=4, minimum_stock=5,
            )
            db.add_all([customer, product])
            db.commit()
            db.refresh(customer)
            db.refresh(product)
            db.add_all([
                Sale(
                    business_id=shop["id"], product_id=product.id, quantity=2,
                    selling_price=30, cost_price=20, total_amount=60, profit=20,
                ),
                Udhaar(
                    business_id=shop["id"], customer_id=customer.id, amount=100,
                    amount_paid=25, status="partial", due_date=datetime.now() + timedelta(days=1),
                ),
            ])
            db.commit()

        upstream = io.BytesIO(json.dumps({"message": {"content": "Recorded sales are ₹60 and open Udhaar is ₹75."}}).encode())
        tags = io.BytesIO(json.dumps({"models": [{"name": "demo-model:latest"}]}).encode())
        headers = {"X-CSRF-Token": auth["csrf_token"]}
        with patch("app.routers.coach.ollama_settings", return_value=("http://ollama.test", "demo-model")), patch(
            "app.routers.coach.urlopen", side_effect=[upstream, tags]
        ) as ollama_call:
            response = self.client.post(
                f"/coach/business/{shop['id']}/ask", headers=headers,
                json={"message": "Summarize sales, stock and Udhaar."},
            )
            status = self.client.get(f"/coach/business/{shop['id']}/status")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["source"], "ollama")
        sent_prompt = json.loads(ollama_call.call_args_list[0].args[0].data)["messages"][1]["content"]
        self.assertIn("Coach Test Shop", sent_prompt)
        self.assertIn("Actual Rice", sent_prompt)
        self.assertIn('"total_amount": 60.0', sent_prompt)
        self.assertIn('"outstanding_amount": 75.0', sent_prompt)
        self.assertNotIn("Private Customer", sent_prompt)
        self.assertNotIn("9876543210", sent_prompt)

        self.assertEqual(status.status_code, 200)
        self.assertTrue(status.json()["available"])

        with patch("app.routers.coach.ollama_settings", return_value=("http://ollama.test", "demo-model")), patch(
            "app.routers.coach.urlopen", side_effect=URLError("offline")
        ):
            offline = self.client.post(
                f"/coach/business/{shop['id']}/ask", headers=headers,
                json={"message": "How are sales?"},
            )
            offline_status = self.client.get(f"/coach/business/{shop['id']}/status")
        self.assertEqual(offline.status_code, 503)
        self.assertIn("unavailable", offline.json()["detail"].lower())
        self.assertFalse(offline_status.json()["available"])

    def test_coach_cannot_read_another_owners_shop(self):
        first = self.register(self.client, "first-coach@example.test").json()
        first_shop = self.create_shop(self.client, first["csrf_token"], "First Coach Shop").json()
        other = TestClient(app)
        try:
            second = self.register(other, "second-coach@example.test").json()
            second_shop = self.create_shop(other, second["csrf_token"], "Second Coach Shop").json()
            response = self.client.post(
                f"/coach/business/{second_shop['id']}/ask",
                headers={"X-CSRF-Token": first["csrf_token"]},
                json={"message": "Show me their sales"},
            )
            self.assertEqual(response.status_code, 404)
            with patch("app.routers.coach.ollama_settings", return_value=("http://ollama.test", "demo-model")), patch(
                "app.routers.coach.urlopen", side_effect=URLError("offline")
            ):
                own_response = self.client.post(
                    f"/coach/business/{first_shop['id']}/ask",
                    headers={"X-CSRF-Token": first["csrf_token"]},
                    json={"message": "Show my sales"},
                )
            self.assertEqual(own_response.status_code, 503)
        finally:
            other.close()

    def test_ollama_cloud_bearer_auth_success_and_auth_failure(self):
        with patch.dict(os.environ, {"OLLAMA_BASE_URL": "https://ollama.com", "OLLAMA_MODEL": ""}):
            self.assertEqual(ollama_settings(), ("https://ollama.com", ""))
        with patch.dict(os.environ, {"OLLAMA_BASE_URL": "http://localhost:11434", "OLLAMA_MODEL": ""}):
            self.assertEqual(ollama_settings(), ("http://localhost:11434", "qwen3:8b"))

        registration = self.register(self.client, "cloud-coach@example.test")
        auth = registration.json()
        shop = self.create_shop(self.client, auth["csrf_token"], "Cloud Coach Shop").json()
        headers = {"X-CSRF-Token": auth["csrf_token"]}
        api_key = "unit-test-cloud-key"
        with patch.dict(os.environ, {"OLLAMA_API_KEY": api_key}):
            self.assertNotIn("Authorization", ollama_headers("http://localhost:11434"))
        chat_response = io.BytesIO(
            json.dumps({"message": {"content": "Cloud coach test response."}}).encode()
        )
        tags_response = io.BytesIO(
            json.dumps({"models": [{"name": "supported-cloud-model"}]}).encode()
        )

        with patch(
            "app.routers.coach.ollama_settings",
            return_value=("https://ollama.com", "supported-cloud-model"),
        ), patch.dict(os.environ, {"OLLAMA_API_KEY": api_key}), patch(
            "app.routers.coach.urlopen", side_effect=[chat_response, tags_response]
        ) as cloud_call:
            response = self.client.post(
                f"/coach/business/{shop['id']}/ask",
                headers=headers,
                json={"message": "Summarize this shop."},
            )
            status = self.client.get(f"/coach/business/{shop['id']}/status")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["response"], "Cloud coach test response.")
        self.assertEqual(cloud_call.call_args_list[0].args[0].get_header("Authorization"), f"Bearer {api_key}")
        self.assertEqual(cloud_call.call_args_list[1].args[0].get_header("Authorization"), f"Bearer {api_key}")
        self.assertTrue(status.json()["available"])

        auth_error = HTTPError(
            "https://ollama.com/api/chat", 401, "Unauthorized", None,
            io.BytesIO(b'{"error":"invalid key"}'),
        )
        with patch(
            "app.routers.coach.ollama_settings",
            return_value=("https://ollama.com", "supported-cloud-model"),
        ), patch.dict(os.environ, {"OLLAMA_API_KEY": api_key}), patch(
            "app.routers.coach.urlopen", side_effect=auth_error
        ):
            failed = self.client.post(
                f"/coach/business/{shop['id']}/ask",
                headers=headers,
                json={"message": "Summarize this shop."},
            )

        self.assertEqual(failed.status_code, 503)
        self.assertIn("authentication failed", failed.json()["detail"].lower())
        self.assertNotIn(api_key, failed.text)


def tearDownModule():
    engine.dispose()
    _test_directory.cleanup()


if __name__ == "__main__":
    unittest.main()
