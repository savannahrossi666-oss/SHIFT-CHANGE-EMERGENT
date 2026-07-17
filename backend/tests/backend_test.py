"""Shift Change beta backend API tests"""
import os
import time
import base64
import pytest
import requests
import websocket  # from websocket-client
import json
import threading

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://value-unlocked.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ALICE = {"email": "alice+earn@test.sc", "password": "pw12345"}
BOB = {"email": "bob+seek@test.sc", "password": "pw12345"}


# ---------- helpers ----------
def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    return r.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def alice():
    return login(ALICE)


@pytest.fixture(scope="module")
def bob():
    return login(BOB)


# ---------- Auth ----------
class TestAuth:
    def test_health_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_signup_new_user(self):
        email = f"test+{int(time.time()*1000)}@sctest.io"
        r = requests.post(f"{API}/auth/signup", json={
            "email": email, "password": "pw12345", "name": "Test User", "role": "earner"
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and data["user"]["email"] == email
        assert data["user"]["role"] == "earner"
        # login as same
        r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": "pw12345"}, timeout=10)
        assert r2.status_code == 200

    def test_signup_duplicate_email(self):
        r = requests.post(f"{API}/auth/signup", json={
            "email": ALICE["email"], "password": "x", "name": "x", "role": "earner"
        }, timeout=15)
        assert r.status_code == 400

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nobody@x.com", "password": "x"}, timeout=10)
        assert r.status_code == 401

    def test_login_alice_and_me(self, alice):
        assert alice["user"]["role"] == "earner"
        r = requests.get(f"{API}/auth/me", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        assert r.json()["email"] == ALICE["email"]
        assert "password_hash" not in r.json()

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Profile ----------
class TestProfile:
    def test_update_profile(self, alice):
        r = requests.patch(f"{API}/profile",
                           json={"bio": "Test bio "+str(time.time()), "skills": ["design", "logos"],
                                 "portfolio": [{"title": "Case study", "url": "https://x.com"}]},
                           headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        data = r.json()
        assert "design" in data["skills"]
        assert data["portfolio"][0]["title"] == "Case study"

    def test_public_user_no_email(self, alice):
        uid = alice["user"]["user_id"]
        r = requests.get(f"{API}/users/{uid}")
        assert r.status_code == 200
        assert "email" not in r.json()
        assert "wallet_balance" not in r.json()


# ---------- Shifts ----------
class TestShifts:
    def test_create_list_shift(self, bob):
        title = f"TEST shift {int(time.time())}"
        r = requests.post(f"{API}/shifts", json={
            "kind": "service", "title": title, "description": "desc", "price": 100,
            "tags": ["logo", "design"]
        }, headers=auth_headers(bob["token"]))
        assert r.status_code == 200
        sid = r.json()["shift_id"]
        assert r.json()["status"] == "open"

        # list with search
        r = requests.get(f"{API}/shifts", params={"q": title[:10]}, headers=auth_headers(bob["token"]))
        assert r.status_code == 200
        assert any(s["shift_id"] == sid for s in r.json())

        # list with kind filter
        r = requests.get(f"{API}/shifts", params={"kind": "service"}, headers=auth_headers(bob["token"]))
        assert r.status_code == 200

        # get shift
        r = requests.get(f"{API}/shifts/{sid}", headers=auth_headers(bob["token"]))
        assert r.status_code == 200
        return sid

    def test_cannot_accept_own(self, bob):
        r = requests.post(f"{API}/shifts", json={
            "kind": "gig", "title": "own", "description": "d", "price": 1
        }, headers=auth_headers(bob["token"]))
        sid = r.json()["shift_id"]
        r = requests.post(f"{API}/shifts/{sid}/action", json={"action": "accept"},
                          headers=auth_headers(bob["token"]))
        assert r.status_code == 400


# ---------- End-to-end workspace ----------
@pytest.fixture(scope="module")
def accepted_workspace(alice, bob):
    """Bob creates a shift, Alice accepts it -> workspace created."""
    r = requests.post(f"{API}/shifts", json={
        "kind": "service", "title": f"TEST e2e {int(time.time())}",
        "description": "For e2e", "price": 50, "tags": ["logo"]
    }, headers=auth_headers(bob["token"]))
    assert r.status_code == 200
    sid = r.json()["shift_id"]
    r = requests.post(f"{API}/shifts/{sid}/action", json={"action": "accept"},
                      headers=auth_headers(alice["token"]))
    assert r.status_code == 200, r.text
    wsid = r.json()["workspace_id"]
    assert wsid
    return {"shift_id": sid, "workspace_id": wsid}


class TestWorkspace:
    def test_get_workspace(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        r = requests.get(f"{API}/workspaces/{wsid}", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        w = r.json()
        assert "messages" in w and "files" in w
        assert w["payment_status"] == "pending"

    def test_chat_message(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        r = requests.post(f"{API}/workspaces/{wsid}/messages", json={"text": "hi from alice"},
                          headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        # verify via GET
        r = requests.get(f"{API}/workspaces/{wsid}", headers=auth_headers(alice["token"]))
        assert any(m["text"] == "hi from alice" for m in r.json()["messages"])

    def test_tasks_add_toggle(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        r = requests.post(f"{API}/workspaces/{wsid}/tasks", json={"title": "first task"},
                          headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        tid = r.json()["task_id"]
        r = requests.patch(f"{API}/workspaces/{wsid}/tasks/{tid}", json={"done": True},
                           headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        r = requests.get(f"{API}/workspaces/{wsid}", headers=auth_headers(alice["token"]))
        task = next(t for t in r.json()["tasks"] if t["task_id"] == tid)
        assert task["done"] is True

    def test_notes(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        r = requests.patch(f"{API}/workspaces/{wsid}/notes", json={"notes": "meeting @ 4"},
                           headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        r = requests.get(f"{API}/workspaces/{wsid}", headers=auth_headers(alice["token"]))
        assert r.json()["notes"] == "meeting @ 4"

    def test_file_upload_and_download(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        payload = {"name": "hi.txt", "mime": "text/plain", "size": 5,
                   "data": base64.b64encode(b"hello").decode()}
        r = requests.post(f"{API}/workspaces/{wsid}/files", json=payload,
                          headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        fid = r.json()["file_id"]
        r = requests.get(f"{API}/workspaces/{wsid}/files/{fid}", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        assert r.json()["data"] == payload["data"]

    def test_pay_mocked(self, alice, accepted_workspace):
        wsid = accepted_workspace["workspace_id"]
        r = requests.post(f"{API}/workspaces/{wsid}/pay", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        assert r.json()["payment_status"] == "paid"

    def test_non_participant_denied(self, accepted_workspace):
        # signup a fresh user
        email = f"outsider+{int(time.time()*1000)}@sctest.io"
        r = requests.post(f"{API}/auth/signup", json={
            "email": email, "password": "pw12345", "name": "Out", "role": "seeker"})
        tok = r.json()["token"]
        r = requests.get(f"{API}/workspaces/{accepted_workspace['workspace_id']}",
                         headers=auth_headers(tok))
        assert r.status_code == 404

    def test_complete_shift(self, alice, accepted_workspace):
        r = requests.post(f"{API}/shifts/{accepted_workspace['shift_id']}/action",
                          json={"action": "complete"}, headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        assert r.json()["status"] == "completed"


# ---------- Reviews / Notifications / Wallet / Recs ----------
class TestMisc:
    def test_review_updates_rating(self, alice, bob):
        r = requests.post(f"{API}/reviews/{alice['user']['user_id']}",
                          json={"stars": 5, "text": "great"},
                          headers=auth_headers(bob["token"]))
        assert r.status_code == 200
        r = requests.get(f"{API}/users/{alice['user']['user_id']}")
        assert r.json()["review_count"] >= 1
        assert r.json()["rating"] > 0

    def test_review_self_forbidden(self, alice):
        r = requests.post(f"{API}/reviews/{alice['user']['user_id']}",
                          json={"stars": 5}, headers=auth_headers(alice["token"]))
        assert r.status_code == 400

    def test_notifications(self, alice):
        r = requests.get(f"{API}/notifications", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        r = requests.post(f"{API}/notifications/read", headers=auth_headers(alice["token"]))
        assert r.status_code == 200

    def test_wallet(self, alice):
        r = requests.get(f"{API}/wallet", headers=auth_headers(alice["token"]))
        assert r.status_code == 200
        d = r.json()
        assert "balance" in d and "MOCKED" in d.get("note", "")

    def test_recommendations(self, bob):
        r = requests.get(f"{API}/recommendations", headers=auth_headers(bob["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- WebSocket ----------
class TestWebSocket:
    def test_ws_connect_and_join(self, alice, accepted_workspace):
        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + f"/api/ws/{alice['token']}"
        received = []
        try:
            ws = websocket.create_connection(ws_url, timeout=10)
        except Exception as e:
            pytest.skip(f"WS not routable in env: {e}")
        try:
            ws.send(json.dumps({"type": "join", "workspace_id": accepted_workspace["workspace_id"]}))
            ws.settimeout(5)
            resp = json.loads(ws.recv())
            assert resp.get("type") == "joined"

            # Send a chat via API and expect broadcast on ws
            def reader():
                try:
                    while True:
                        received.append(json.loads(ws.recv()))
                except Exception:
                    pass
            t = threading.Thread(target=reader, daemon=True); t.start()
            time.sleep(0.5)
            requests.post(f"{API}/workspaces/{accepted_workspace['workspace_id']}/messages",
                          json={"text": "ws hello"}, headers=auth_headers(alice["token"]))
            time.sleep(2)
            assert any(m.get("type") == "message" and m["data"]["text"] == "ws hello" for m in received), \
                f"no ws broadcast; received={received}"
        finally:
            try: ws.close()
            except Exception: pass
