from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid, logging, hashlib, hmac, base64, json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"

app = FastAPI(title="Shift Change API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("shiftchange")
logging.basicConfig(level=logging.INFO)


# ============ HELPERS ============
def now():
    return datetime.now(timezone.utc)

def uid(prefix="u"):
    return f"{prefix}_{uuid.uuid4().hex[:14]}"

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False

def make_jwt(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "iat": int(now().timestamp()), "exp": int((now() + timedelta(days=7)).timestamp())},
        JWT_SECRET, algorithm=JWT_ALG,
    )

def clean(doc):
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


# ============ MODELS ============
Role = Literal["earner", "seeker", "both"]

class SignupIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Role

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    photo: Optional[str] = None            # base64 or URL for prototype
    skills: Optional[List[str]] = None
    services: Optional[List[str]] = None
    products: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    portfolio: Optional[List[Dict[str, Any]]] = None  # [{title,url,thumb}]
    location: Optional[str] = None

class ShiftIn(BaseModel):
    kind: Literal["service", "gig", "consultation", "rental", "product", "custom"]
    title: str
    description: str
    price: float
    currency: str = "USD"
    tags: List[str] = []
    location: Optional[str] = None
    delivery: Optional[str] = None  # remote/onsite

class ShiftAction(BaseModel):
    action: Literal["accept", "decline", "complete", "cancel"]

class ChatIn(BaseModel):
    text: str

class TaskIn(BaseModel):
    title: str

class TaskUpdate(BaseModel):
    done: bool

class ReviewIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    text: Optional[str] = ""


# ============ AUTH ============
bearer = HTTPBearer(auto_error=False)

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), request: Request = None):
    token = None
    if credentials:
        token = credentials.credentials
    if not token and request is not None:
        token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    # Try JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        u = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not u:
            raise HTTPException(401, "User not found")
        return u
    except jwt.PyJWTError:
        pass
    # Fallback: emergent session_token
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(401, "Invalid token")
    exp = sess["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now():
        raise HTTPException(401, "Session expired")
    u = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not u:
        raise HTTPException(401, "User not found")
    return u


@api.post("/auth/signup")
async def signup(body: SignupIn):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = uid("user")
    doc = {
        "user_id": user_id,
        "email": body.email,
        "name": body.name,
        "role": body.role,
        "password_hash": hash_pw(body.password),
        "auth_provider": "password",
        "photo": None,
        "bio": "",
        "skills": [], "services": [], "products": [], "equipment": [], "portfolio": [],
        "location": None,
        "verified": False,
        "rating": 0.0,
        "review_count": 0,
        "wallet_balance": 0.0,
        "created_at": now().isoformat(),
    }
    await db.users.insert_one(doc)
    token = make_jwt(user_id)
    return {"token": token, "user": clean({k: v for k, v in doc.items() if k != "password_hash"})}


@api.post("/auth/login")
async def login(body: LoginIn):
    u = await db.users.find_one({"email": body.email})
    if not u or not u.get("password_hash") or not verify_pw(body.password, u["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_jwt(u["user_id"])
    u.pop("password_hash", None)
    return {"token": token, "user": clean(u)}


@api.post("/auth/google/session")
async def google_session(body: dict):
    """Exchange Emergent session_id for our session token and upsert user."""
    session_id = body.get("session_id")
    role = body.get("role", "seeker")
    if not session_id:
        raise HTTPException(400, "session_id required")
    async with httpx.AsyncClient(timeout=15.0) as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(401, "Invalid session")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name") or existing.get("name"), "photo": data.get("picture") or existing.get("photo")}})
    else:
        user_id = uid("user")
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "role": role, "auth_provider": "google",
            "photo": data.get("picture"), "bio": "",
            "skills": [], "services": [], "products": [], "equipment": [], "portfolio": [],
            "location": None, "verified": False, "rating": 0.0, "review_count": 0,
            "wallet_balance": 0.0, "created_at": now().isoformat(),
        })
    # Store emergent session_token
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": data["session_token"],
        "expires_at": (now() + timedelta(days=7)).isoformat(),
        "created_at": now().isoformat(),
    })
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"token": data["session_token"], "user": u}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    user.pop("password_hash", None)
    return user


@api.post("/auth/logout")
async def logout(request: Request, user=Depends(current_user)):
    tok = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        tok = auth.split(" ", 1)[1]
    tok = tok or request.cookies.get("session_token")
    if tok:
        await db.user_sessions.delete_one({"session_token": tok})
    return {"ok": True}


# ============ PROFILE ============
@api.patch("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(current_user)):
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    u = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return u


@api.get("/users/{user_id}")
async def get_user(user_id: str):
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0, "email": 0, "wallet_balance": 0})
    if not u:
        raise HTTPException(404, "Not found")
    return u


# ============ SHIFTS ============
@api.post("/shifts")
async def create_shift(body: ShiftIn, user=Depends(current_user)):
    sid = uid("shift")
    doc = {
        "shift_id": sid,
        "owner_id": user["user_id"],
        "owner_name": user["name"],
        "owner_role": user["role"],
        **body.model_dump(),
        "status": "open",   # open | accepted | in_progress | completed | cancelled
        "accepted_by": None,
        "workspace_id": None,
        "created_at": now().isoformat(),
    }
    await db.shifts.insert_one(doc)
    return clean(doc)


@api.get("/shifts")
async def list_shifts(q: Optional[str] = None, kind: Optional[str] = None, mine: bool = False, user=Depends(current_user)):
    query = {}
    if mine:
        query["$or"] = [{"owner_id": user["user_id"]}, {"accepted_by": user["user_id"]}]
    if kind:
        query["kind"] = kind
    if q:
        query["$or"] = query.get("$or", []) + [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}, {"tags": {"$regex": q, "$options": "i"}}]
    cur = db.shifts.find(query, {"_id": 0}).sort("created_at", -1).limit(100)
    return await cur.to_list(100)


@api.get("/shifts/{shift_id}")
async def get_shift(shift_id: str, user=Depends(current_user)):
    s = await db.shifts.find_one({"shift_id": shift_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Not found")
    return s


@api.post("/shifts/{shift_id}/action")
async def action_shift(shift_id: str, body: ShiftAction, user=Depends(current_user)):
    s = await db.shifts.find_one({"shift_id": shift_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Not found")
    updates = {}
    if body.action == "accept":
        if s["owner_id"] == user["user_id"]:
            raise HTTPException(400, "Cannot accept your own shift")
        if s["status"] != "open":
            raise HTTPException(400, "Shift is not open")
        wsid = uid("ws")
        updates = {"status": "accepted", "accepted_by": user["user_id"], "workspace_id": wsid}
        # Create workspace + auto-seed a warm welcome message from the seeker/owner
        await db.workspaces.insert_one({
            "workspace_id": wsid,
            "shift_id": shift_id,
            "shift_title": s["title"],
            "shift_price": s["price"],
            "shift_currency": s.get("currency", "USD"),
            "owner_id": s["owner_id"],
            "accepted_by": user["user_id"],
            "participants": [s["owner_id"], user["user_id"]],
            "tasks": [], "notes": "",
            "payment_status": "pending",   # pending | held | released
            "timeline": [
                {"ts": now().isoformat(), "type": "created", "text": f"Workspace opened — {s['title']}", "by": user["user_id"]},
                {"ts": now().isoformat(), "type": "accepted", "text": f"{user['name']} accepted the shift", "by": user["user_id"]},
            ],
            "created_at": now().isoformat(),
        })
        # Auto-seed a welcome message from the shift owner
        await db.messages.insert_one({
            "msg_id": uid("m"), "workspace_id": wsid, "user_id": s["owner_id"], "user_name": s["owner_name"],
            "text": f"Hey {user['name'].split(' ')[0]} — thanks for taking this on! Let me know what info you need to get started. 👋",
            "ts": now().isoformat(),
        })
        await notify(s["owner_id"], f"{user['name']} accepted your shift: {s['title']}", f"/workspace/{wsid}")
    elif body.action == "complete":
        if s["owner_id"] != user["user_id"] and s["accepted_by"] != user["user_id"]:
            raise HTTPException(403, "Not a participant")
        updates = {"status": "completed", "completed_at": now().isoformat()}
        if s.get("workspace_id"):
            w = await db.workspaces.find_one({"workspace_id": s["workspace_id"]}, {"_id": 0}) or {}
            # If payment was held, release it to the earner; simulate wallet balance movement
            release_ok = w.get("payment_status") == "held"
            new_status = "released" if release_ok else w.get("payment_status", "pending")
            await db.workspaces.update_one(
                {"workspace_id": s["workspace_id"]},
                {"$set": {"payment_status": new_status, "completed_at": now().isoformat()},
                 "$push": {"timeline": {"ts": now().isoformat(), "type": "completed", "text": "Shift marked complete", "by": user["user_id"]}}},
            )
            if release_ok and s.get("accepted_by"):
                await db.users.update_one({"user_id": s["accepted_by"]},
                                          {"$inc": {"wallet_balance": float(s.get("price", 0))}})
                await notify(s["accepted_by"], f"${s['price']} released for {s['title']}", f"/workspace/{s['workspace_id']}")
    elif body.action == "cancel":
        if s["owner_id"] != user["user_id"]:
            raise HTTPException(403, "Only owner can cancel")
        updates = {"status": "cancelled"}
    elif body.action == "decline":
        updates = {}  # noop for now
    if updates:
        await db.shifts.update_one({"shift_id": shift_id}, {"$set": updates})
    return await db.shifts.find_one({"shift_id": shift_id}, {"_id": 0})


# ============ WORKSPACE ============
@api.get("/workspaces")
async def my_workspaces(user=Depends(current_user)):
    cur = db.workspaces.find({"participants": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    return await cur.to_list(100)


@api.get("/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    # attach messages & files
    msgs = await db.messages.find({"workspace_id": workspace_id}, {"_id": 0}).sort("ts", 1).to_list(500)
    files = await db.files.find({"workspace_id": workspace_id}, {"_id": 0, "data": 0}).sort("ts", -1).to_list(200)
    w["messages"] = msgs
    w["files"] = files
    return w


@api.post("/workspaces/{workspace_id}/messages")
async def send_message(workspace_id: str, body: ChatIn, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    msg = {"msg_id": uid("m"), "workspace_id": workspace_id, "user_id": user["user_id"],
           "user_name": user["name"], "text": body.text, "ts": now().isoformat()}
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    # Broadcast via WS
    await ws_manager.broadcast(workspace_id, {"type": "message", "data": msg})
    # Notify other participants
    for pid in w["participants"]:
        if pid != user["user_id"]:
            await notify(pid, f"{user['name']}: {body.text[:60]}", f"/workspace/{workspace_id}")
    return msg


@api.post("/workspaces/{workspace_id}/tasks")
async def add_task(workspace_id: str, body: TaskIn, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    task = {"task_id": uid("t"), "title": body.title, "done": False, "created_by": user["user_id"], "ts": now().isoformat()}
    await db.workspaces.update_one({"workspace_id": workspace_id},
                                   {"$push": {"tasks": task, "timeline": {"ts": now().isoformat(), "type": "task_added", "text": f"Task added: {body.title}", "by": user["user_id"]}}})
    await ws_manager.broadcast(workspace_id, {"type": "task_added", "data": task})
    return task


@api.patch("/workspaces/{workspace_id}/tasks/{task_id}")
async def toggle_task(workspace_id: str, task_id: str, body: TaskUpdate, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    await db.workspaces.update_one({"workspace_id": workspace_id, "tasks.task_id": task_id},
                                   {"$set": {"tasks.$.done": body.done}})
    await ws_manager.broadcast(workspace_id, {"type": "task_updated", "data": {"task_id": task_id, "done": body.done}})
    return {"ok": True}


@api.patch("/workspaces/{workspace_id}/notes")
async def update_notes(workspace_id: str, body: dict, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    await db.workspaces.update_one({"workspace_id": workspace_id}, {"$set": {"notes": body.get("notes", "")}})
    return {"ok": True}


@api.post("/workspaces/{workspace_id}/files")
async def upload_file(workspace_id: str, body: dict, user=Depends(current_user)):
    """Prototype: accepts base64 data. Cloud storage integration is a follow-up."""
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    fid = uid("f")
    doc = {"file_id": fid, "workspace_id": workspace_id, "user_id": user["user_id"], "user_name": user["name"],
           "name": body.get("name", "file"), "mime": body.get("mime", "application/octet-stream"),
           "size": body.get("size", 0), "data": body.get("data", ""), "ts": now().isoformat()}
    await db.files.insert_one(doc)
    doc.pop("data", None)
    doc.pop("_id", None)
    await db.workspaces.update_one({"workspace_id": workspace_id},
                                   {"$push": {"timeline": {"ts": now().isoformat(), "type": "file_uploaded", "text": f"File uploaded: {doc['name']}", "by": user["user_id"]}}})
    await ws_manager.broadcast(workspace_id, {"type": "file_uploaded", "data": doc})
    return doc


@api.get("/workspaces/{workspace_id}/files/{file_id}")
async def get_file(workspace_id: str, file_id: str, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    f = await db.files.find_one({"file_id": file_id}, {"_id": 0})
    if not f:
        raise HTTPException(404, "Not found")
    return f


@api.post("/workspaces/{workspace_id}/pay")
async def mark_paid(workspace_id: str, body: dict = None, user=Depends(current_user)):
    """SIMULATED PAYMENT — records a receipt in escrow. Funds release on completion.
    Real Stripe integration is a follow-up (needs playbook + keys).
    """
    body = body or {}
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    if w.get("payment_status") in ("held", "released"):
        raise HTTPException(400, "Already paid")
    # Simulate a card charge — no real charge, no PAN stored
    last4 = (body.get("card_last4") or "4242")[-4:]
    receipt = {
        "receipt_id": uid("rc"),
        "workspace_id": workspace_id,
        "shift_id": w.get("shift_id"),
        "amount": float(w.get("shift_price") or 0),
        "currency": w.get("shift_currency", "USD"),
        "payer_id": user["user_id"],
        "payer_name": user["name"],
        "payee_id": w.get("accepted_by"),
        "method": "card",
        "card_brand": body.get("card_brand", "Visa"),
        "card_last4": last4,
        "status": "held_in_escrow",
        "created_at": now().isoformat(),
        "note": "SIMULATED — no real charge",
    }
    await db.receipts.insert_one(receipt)
    receipt.pop("_id", None)
    await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {"$set": {"payment_status": "held", "receipt_id": receipt["receipt_id"]},
         "$push": {"timeline": {"ts": now().isoformat(), "type": "paid", "text": f"Payment held in escrow — ${receipt['amount']} · •••• {last4}", "by": user["user_id"]}}},
    )
    if w.get("accepted_by"):
        await notify(w["accepted_by"], f"Payment of ${receipt['amount']} held in escrow — release on completion", f"/workspace/{workspace_id}")
    return {"ok": True, "payment_status": "held", "receipt": receipt}


@api.get("/workspaces/{workspace_id}/receipt")
async def get_receipt(workspace_id: str, user=Depends(current_user)):
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    if not w.get("receipt_id"):
        return None
    return await db.receipts.find_one({"receipt_id": w["receipt_id"]}, {"_id": 0})


# ============ REVIEWS ============
@api.post("/reviews/{user_id}")
async def leave_review(user_id: str, body: ReviewIn, user=Depends(current_user)):
    if user_id == user["user_id"]:
        raise HTTPException(400, "Cannot review yourself")
    doc = {"review_id": uid("r"), "target_id": user_id, "author_id": user["user_id"], "author_name": user["name"],
           "stars": body.stars, "text": body.text or "", "ts": now().isoformat()}
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    # recalc rating
    agg = await db.reviews.aggregate([{"$match": {"target_id": user_id}},
                                      {"$group": {"_id": None, "avg": {"$avg": "$stars"}, "n": {"$sum": 1}}}]).to_list(1)
    if agg:
        await db.users.update_one({"user_id": user_id}, {"$set": {"rating": round(agg[0]["avg"], 2), "review_count": agg[0]["n"]}})
    return doc


@api.get("/reviews/{user_id}")
async def get_reviews(user_id: str):
    return await db.reviews.find({"target_id": user_id}, {"_id": 0}).sort("ts", -1).to_list(50)


# ============ NOTIFICATIONS ============
async def notify(user_id: str, text: str, link: str = ""):
    doc = {"notif_id": uid("n"), "user_id": user_id, "text": text, "link": link, "read": False, "ts": now().isoformat()}
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    await ws_manager.notify(user_id, doc)


@api.get("/notifications")
async def list_notifications(user=Depends(current_user)):
    return await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("ts", -1).limit(50).to_list(50)


@api.post("/notifications/read")
async def mark_read(user=Depends(current_user)):
    await db.notifications.update_many({"user_id": user["user_id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


# ============ RECOMMENDATIONS ============
@api.get("/recommendations")
async def recommendations(user=Depends(current_user)):
    """Simple: recent open shifts of kinds relevant to the user's role, excluding their own."""
    tags_of_interest = list({*(user.get("skills") or []), *(user.get("services") or [])})
    query = {"status": "open", "owner_id": {"$ne": user["user_id"]}}
    if tags_of_interest:
        query["$or"] = [{"tags": {"$in": tags_of_interest}}, {"title": {"$regex": "|".join(tags_of_interest), "$options": "i"}}]
    cur = db.shifts.find(query, {"_id": 0}).sort("created_at", -1).limit(12)
    docs = await cur.to_list(12)
    if not docs:  # fallback: latest open shifts
        cur = db.shifts.find({"status": "open", "owner_id": {"$ne": user["user_id"]}}, {"_id": 0}).sort("created_at", -1).limit(12)
        docs = await cur.to_list(12)
    return docs


# ============ WALLET (MOCKED) ============
@api.get("/wallet")
async def wallet(user=Depends(current_user)):
    completed = await db.shifts.count_documents({"accepted_by": user["user_id"], "status": "completed"})
    pending = await db.shifts.count_documents({"accepted_by": user["user_id"], "status": {"$in": ["accepted", "in_progress"]}})
    return {
        "balance": user.get("wallet_balance", 0.0),
        "currency": "USD",
        "completed_shifts": completed,
        "pending_shifts": pending,
        "note": "MOCKED — Stripe integration is a follow-up.",
    }


# ============ WEBSOCKETS ============
class WSManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
        self.user_socks: Dict[str, List[WebSocket]] = {}

    async def join_room(self, ws: WebSocket, room: str):
        self.rooms.setdefault(room, []).append(ws)

    async def leave_room(self, ws: WebSocket, room: str):
        if room in self.rooms and ws in self.rooms[room]:
            self.rooms[room].remove(ws)

    async def add_user(self, ws: WebSocket, user_id: str):
        self.user_socks.setdefault(user_id, []).append(ws)

    async def remove_user(self, ws: WebSocket, user_id: str):
        if user_id in self.user_socks and ws in self.user_socks[user_id]:
            self.user_socks[user_id].remove(ws)

    async def broadcast(self, room: str, msg: dict):
        for ws in list(self.rooms.get(room, [])):
            try:
                await ws.send_json(msg)
            except Exception:
                pass

    async def notify(self, user_id: str, msg: dict):
        for ws in list(self.user_socks.get(user_id, [])):
            try:
                await ws.send_json({"type": "notification", "data": msg})
            except Exception:
                pass

ws_manager = WSManager()


@app.websocket("/api/ws/{token}")
async def ws_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()
    # auth
    user_id = None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["sub"]
    except jwt.PyJWTError:
        sess = await db.user_sessions.find_one({"session_token": token})
        if sess:
            user_id = sess["user_id"]
    if not user_id:
        await websocket.close(code=4401)
        return
    await ws_manager.add_user(websocket, user_id)
    joined_room = None
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "join":
                joined_room = data.get("workspace_id")
                if joined_room:
                    await ws_manager.join_room(websocket, joined_room)
                    await websocket.send_json({"type": "joined", "workspace_id": joined_room})
    except WebSocketDisconnect:
        pass
    finally:
        if joined_room:
            await ws_manager.leave_room(websocket, joined_room)
        await ws_manager.remove_user(websocket, user_id)


@api.get("/")
async def root():
    return {"app": "Shift Change API", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ============ DEMO SEED ============
DEMO_USERS = [
    {
        "user_id": "demo_maya_ph",
        "email": "maya@demo.shiftchange.io",
        "name": "Maya Chen",
        "role": "earner",
        "auth_provider": "demo",
        "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=2&w=400&q=80",
        "bio": "Portrait & event photographer. 8 years turning ordinary rooms into golden-hour memories. Nikon Z8, always ready.",
        "skills": ["Photography", "Photo editing", "Lightroom", "Event coverage"],
        "services": ["Portrait shoots", "Small event coverage", "Product photography"],
        "products": [], "equipment": ["Nikon Z8", "Godox lighting kit", "Sony wireless mics"],
        "portfolio": [{"title": "Rooftop wedding — Brooklyn", "url": "#"}, {"title": "Coffee brand shoot", "url": "#"}],
        "location": "Brooklyn, NY",
        "verified": True, "rating": 4.9, "review_count": 47, "wallet_balance": 1240.0,
    },
    {
        "user_id": "demo_diego_dev",
        "email": "diego@demo.shiftchange.io",
        "name": "Diego Alvarez",
        "role": "earner",
        "auth_provider": "demo",
        "photo": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=400&q=80",
        "bio": "Full-stack dev (React, Django, Postgres). I build MVPs in 2 weeks, not 2 months. Ex-Stripe eng.",
        "skills": ["React", "Django", "Postgres", "TypeScript", "System design"],
        "services": ["MVP builds", "Code review", "Migration audits"],
        "products": [], "equipment": ["M3 MacBook Pro"],
        "portfolio": [{"title": "Fintech dashboard — 2 weeks", "url": "#"}, {"title": "AI intake form for a clinic", "url": "#"}],
        "location": "Austin, TX",
        "verified": True, "rating": 5.0, "review_count": 19, "wallet_balance": 4300.0,
    },
    {
        "user_id": "demo_jordan_tutor",
        "email": "jordan@demo.shiftchange.io",
        "name": "Jordan Okafor",
        "role": "earner",
        "auth_provider": "demo",
        "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=400&q=80",
        "bio": "Math tutor, SAT specialist. Kids average +180 points after 6 sessions with me.",
        "skills": ["Algebra", "Calculus", "SAT Math", "Study strategy"],
        "services": ["Weekly SAT prep", "College math", "Test-week bootcamps"],
        "products": [], "equipment": [],
        "portfolio": [], "location": "Chicago, IL",
        "verified": False, "rating": 4.8, "review_count": 26, "wallet_balance": 780.0,
    },
    {
        "user_id": "demo_avery_seek",
        "email": "avery@demo.shiftchange.io",
        "name": "Avery Nash",
        "role": "seeker",
        "auth_provider": "demo",
        "photo": "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=facearea&facepad=2&w=400&q=80",
        "bio": "Founder of a small candle studio. Always needing help — from photography to a truck to move stock.",
        "skills": [], "services": [], "products": ["Soy candles"], "equipment": [],
        "portfolio": [], "location": "Portland, OR",
        "verified": True, "rating": 4.7, "review_count": 8, "wallet_balance": 0.0,
    },
]

DEMO_SHIFTS = [
    {"owner_id": "demo_avery_seek", "kind": "service", "title": "Product photography for candle line launch",
     "description": "Need 20 clean product shots + 6 lifestyle shots for our fall collection. Studio is set up in Portland — bring your camera. Turnaround 5 days.",
     "price": 640, "tags": ["photography", "product", "small business"], "location": "Portland, OR", "delivery": "onsite"},
    {"owner_id": "demo_avery_seek", "kind": "gig", "title": "Help load a moving truck this Saturday",
     "description": "2 hours, one flight of stairs. I'll provide the truck + straps. Just need a strong friendly human.",
     "price": 90, "tags": ["moving", "one-time"], "location": "Portland, OR", "delivery": "onsite"},
    {"owner_id": "demo_diego_dev", "kind": "consultation", "title": "1-hour system design review",
     "description": "I'll review your codebase, database schema, and API design and leave a written playbook with prioritized fixes. Great for pre-launch teams.",
     "price": 220, "tags": ["consulting", "engineering"], "location": None, "delivery": "remote"},
    {"owner_id": "demo_maya_ph", "kind": "service", "title": "Golden-hour portrait session",
     "description": "90-minute shoot at a location of your choice in NYC. Includes 12 edited high-res photos. Great for personal branding, LinkedIn, dating profiles that don't suck.",
     "price": 380, "tags": ["photography", "portraits"], "location": "New York, NY", "delivery": "onsite"},
    {"owner_id": "demo_maya_ph", "kind": "rental", "title": "Rent my Godox 3-light kit for a weekend",
     "description": "AD200 Pros, softboxes, stands. Local pickup in Brooklyn only. Insurance recommended.",
     "price": 120, "tags": ["rental", "lighting"], "location": "Brooklyn, NY", "delivery": "onsite"},
    {"owner_id": "demo_jordan_tutor", "kind": "service", "title": "Weekly SAT Math prep (4 sessions)",
     "description": "Four 90-min sessions, all remote, tailored to student's diagnostic. Includes 3 practice tests + written progress report.",
     "price": 480, "tags": ["tutoring", "SAT"], "location": None, "delivery": "remote"},
    {"owner_id": "demo_diego_dev", "kind": "product", "title": "Ready-to-deploy Next.js starter with auth + Stripe",
     "description": "A production-tested Next.js 15 template with Google auth, Stripe subscriptions, and admin dashboard. Save yourself 2 weeks.",
     "price": 149, "tags": ["template", "nextjs", "stripe"], "location": None, "delivery": "remote"},
    {"owner_id": "demo_avery_seek", "kind": "custom", "title": "Need a friendly designer to refresh my Instagram grid",
     "description": "Not looking for logos — just someone with taste to redo my 24-post grid in a cohesive palette. Budget flexible.",
     "price": 300, "tags": ["design", "social media"], "location": None, "delivery": "remote"},
]


async def seed_demo():
    """Idempotently seed demo users + shifts so any new signup sees a live-looking marketplace."""
    existing = await db.users.count_documents({"auth_provider": "demo"})
    if existing >= len(DEMO_USERS):
        return
    for u in DEMO_USERS:
        if not await db.users.find_one({"user_id": u["user_id"]}):
            await db.users.insert_one({**u, "created_at": now().isoformat()})
    if await db.shifts.count_documents({"owner_id": {"$in": [u["user_id"] for u in DEMO_USERS]}}) == 0:
        for s in DEMO_SHIFTS:
            owner = next(u for u in DEMO_USERS if u["user_id"] == s["owner_id"])
            await db.shifts.insert_one({
                "shift_id": uid("shift"),
                "owner_id": owner["user_id"], "owner_name": owner["name"], "owner_role": owner["role"],
                "kind": s["kind"], "title": s["title"], "description": s["description"],
                "price": s["price"], "currency": "USD", "tags": s["tags"],
                "location": s.get("location"), "delivery": s.get("delivery"),
                "status": "open", "accepted_by": None, "workspace_id": None,
                "created_at": now().isoformat(),
            })
    logger.info("Demo seed complete — %d users + %d shifts", len(DEMO_USERS), len(DEMO_SHIFTS))


@app.on_event("startup")
async def _startup():
    try:
        await seed_demo()
    except Exception as e:
        logger.exception("seed_demo failed: %s", e)
