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
        # Create workspace
        await db.workspaces.insert_one({
            "workspace_id": wsid,
            "shift_id": shift_id,
            "shift_title": s["title"],
            "participants": [s["owner_id"], user["user_id"]],
            "tasks": [], "notes": "",
            "payment_status": "pending",   # pending | paid | released
            "timeline": [{"ts": now().isoformat(), "type": "created", "text": f"Workspace created — {s['title']}", "by": user["user_id"]}],
            "created_at": now().isoformat(),
        })
        await notify(s["owner_id"], f"{user['name']} accepted your shift: {s['title']}", f"/workspace/{wsid}")
    elif body.action == "complete":
        if s["owner_id"] != user["user_id"] and s["accepted_by"] != user["user_id"]:
            raise HTTPException(403, "Not a participant")
        updates = {"status": "completed"}
        if s.get("workspace_id"):
            await db.workspaces.update_one(
                {"workspace_id": s["workspace_id"]},
                {"$set": {"payment_status": "released"},
                 "$push": {"timeline": {"ts": now().isoformat(), "type": "completed", "text": "Shift completed", "by": user["user_id"]}}},
            )
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
async def mark_paid(workspace_id: str, user=Depends(current_user)):
    """MOCKED PAYMENT — Stripe integration is a follow-up (needs playbook + keys)."""
    w = await db.workspaces.find_one({"workspace_id": workspace_id})
    if not w or user["user_id"] not in w["participants"]:
        raise HTTPException(404, "Not found")
    await db.workspaces.update_one({"workspace_id": workspace_id},
                                   {"$set": {"payment_status": "paid"},
                                    "$push": {"timeline": {"ts": now().isoformat(), "type": "paid", "text": "Payment marked (MOCKED)", "by": user["user_id"]}}})
    return {"ok": True, "payment_status": "paid"}


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
