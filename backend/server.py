from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from twilio.jwt.client import ClientCapabilityToken
from twilio.twiml.voice_response import VoiceResponse, Dial

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
TWILIO_TWIML_APP_SID = os.environ.get('TWILIO_TWIML_APP_SID', 'APa891932b2a6f93e25a72f6df6d83ed2d')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Create the main app
app = FastAPI(title="Abu Al-Zahra VoIP API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= Pydantic Models =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    balance: float
    virtual_number: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CallRequest(BaseModel):
    to_number: str
    record: bool = False
    anonymous: bool = False
    alias_name: Optional[str] = None

class CallResponse(BaseModel):
    call_sid: str
    status: str
    from_number: str
    to_number: str

class CallLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    call_sid: Optional[str] = None
    from_number: str
    to_number: str
    duration: int = 0  # in seconds
    cost: float = 0.0
    status: str = "initiated"
    recording_url: Optional[str] = None
    is_anonymous: bool = False
    alias_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    phone_number: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactCreate(BaseModel):
    name: str
    phone_number: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    to_number: str
    body: str
    direction: str = "outbound"  # inbound or outbound
    status: str = "sent"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    to_number: str
    body: str

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # topup, call, transfer
    amount: float
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TopupRequest(BaseModel):
    amount: float

class TransferRequest(BaseModel):
    to_number: str
    amount: float

class RateCheckRequest(BaseModel):
    phone_number: str

class RateResponse(BaseModel):
    country: str
    rate_per_minute: float
    currency: str = "USD"

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_rate_for_number(phone_number: str) -> dict:
    """Get call rate based on country code"""
    rates = {
        "967": {"country": "اليمن", "rate": 0.15},
        "966": {"country": "السعودية", "rate": 0.08},
        "971": {"country": "الإمارات", "rate": 0.10},
        "20": {"country": "مصر", "rate": 0.07},
        "962": {"country": "الأردن", "rate": 0.09},
        "961": {"country": "لبنان", "rate": 0.12},
        "970": {"country": "فلسطين", "rate": 0.11},
        "964": {"country": "العراق", "rate": 0.14},
        "963": {"country": "سوريا", "rate": 0.16},
        "1": {"country": "أمريكا/كندا", "rate": 0.05},
        "44": {"country": "المملكة المتحدة", "rate": 0.06},
    }
    
    # Clean the number
    clean_number = phone_number.replace("+", "").replace(" ", "").replace("-", "")
    
    for code, info in rates.items():
        if clean_number.startswith(code):
            return info
    
    return {"country": "دولي", "rate": 0.20}

# ============= Auth Routes =============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "balance": 1.00,  # Free $1 for new users
        "virtual_number": TWILIO_PHONE_NUMBER,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user)
    
    # Create welcome transaction
    welcome_trans = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "bonus",
        "amount": 1.00,
        "description": "رصيد ترحيبي مجاني",
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(welcome_trans)
    
    token = create_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            balance=1.00,
            virtual_number=TWILIO_PHONE_NUMBER,
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    token = create_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            balance=user.get("balance", 0),
            virtual_number=user.get("virtual_number"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        balance=user.get("balance", 0),
        virtual_number=user.get("virtual_number"),
        created_at=user["created_at"]
    )

# ============= Call Routes =============

@api_router.post("/calls/initiate", response_model=CallResponse)
async def initiate_call(call_req: CallRequest, user=Depends(get_current_user)):
    if user.get("balance", 0) < 0.05:
        raise HTTPException(status_code=400, detail="رصيد غير كافٍ")
    
    if not twilio_client:
        raise HTTPException(status_code=500, detail="خدمة الاتصال غير متوفرة")
    
    try:
        # Format number
        to_number = call_req.to_number
        if not to_number.startswith("+"):
            to_number = "+" + to_number
        
        # Create Twilio call
        call_params = {
            "to": to_number,
            "from_": TWILIO_PHONE_NUMBER,
            "url": "http://demo.twilio.com/docs/voice.xml",  # TwiML for the call
        }
        
        if call_req.record:
            call_params["record"] = True
        
        call = twilio_client.calls.create(**call_params)
        
        # Log the call
        call_log = CallLog(
            user_id=user["id"],
            call_sid=call.sid,
            from_number=TWILIO_PHONE_NUMBER,
            to_number=to_number,
            status="initiated",
            is_anonymous=call_req.anonymous,
            alias_name=call_req.alias_name if call_req.anonymous else None
        )
        
        await db.call_logs.insert_one(call_log.dict())
        
        return CallResponse(
            call_sid=call.sid,
            status=call.status,
            from_number=TWILIO_PHONE_NUMBER,
            to_number=to_number
        )
        
    except TwilioRestException as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"خطأ في الاتصال: {str(e)}")

@api_router.post("/calls/end/{call_sid}")
async def end_call(call_sid: str, user=Depends(get_current_user)):
    if not twilio_client:
        raise HTTPException(status_code=500, detail="خدمة الاتصال غير متوفرة")
    
    try:
        call = twilio_client.calls(call_sid).update(status="completed")
        
        # Update call log
        await db.call_logs.update_one(
            {"call_sid": call_sid, "user_id": user["id"]},
            {"$set": {"status": "completed"}}
        )
        
        return {"message": "تم إنهاء المكالمة", "status": call.status}
        
    except TwilioRestException as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"خطأ: {str(e)}")

@api_router.get("/calls/status/{call_sid}")
async def get_call_status(call_sid: str, user=Depends(get_current_user)):
    if not twilio_client:
        raise HTTPException(status_code=500, detail="خدمة الاتصال غير متوفرة")
    
    try:
        call = twilio_client.calls(call_sid).fetch()
        
        # Calculate duration and cost
        duration = int(call.duration or 0)
        rate_info = get_rate_for_number(call.to)
        cost = (duration / 60) * rate_info["rate"]
        
        # Update call log
        await db.call_logs.update_one(
            {"call_sid": call_sid, "user_id": user["id"]},
            {"$set": {
                "status": call.status,
                "duration": duration,
                "cost": round(cost, 2)
            }}
        )
        
        # Deduct balance if call completed
        if call.status == "completed" and duration > 0:
            await db.users.update_one(
                {"id": user["id"]},
                {"$inc": {"balance": -cost}}
            )
            
            # Add transaction
            trans = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "type": "call",
                "amount": -cost,
                "description": f"مكالمة إلى {call.to} ({duration}s)",
                "created_at": datetime.utcnow()
            }
            await db.transactions.insert_one(trans)
        
        return {
            "call_sid": call_sid,
            "status": call.status,
            "duration": duration,
            "cost": round(cost, 2)
        }
        
    except TwilioRestException as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"خطأ: {str(e)}")

@api_router.get("/calls/logs", response_model=List[CallLog])
async def get_call_logs(user=Depends(get_current_user)):
    logs = await db.call_logs.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [CallLog(**log) for log in logs]

@api_router.get("/calls/recordings")
async def get_recordings(user=Depends(get_current_user)):
    logs = await db.call_logs.find({
        "user_id": user["id"],
        "recording_url": {"$ne": None}
    }).sort("created_at", -1).to_list(100)
    return [CallLog(**log) for log in logs]

# ============= Contact Routes =============

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact_data: ContactCreate, user=Depends(get_current_user)):
    contact = Contact(
        user_id=user["id"],
        name=contact_data.name,
        phone_number=contact_data.phone_number
    )
    await db.contacts.insert_one(contact.dict())
    return contact

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(user=Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": user["id"]}).sort("name", 1).to_list(1000)
    return [Contact(**c) for c in contacts]

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user=Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="جهة الاتصال غير موجودة")
    return {"message": "تم الحذف"}

# ============= Message Routes =============

@api_router.post("/messages/send", response_model=Message)
async def send_message(msg_data: MessageCreate, user=Depends(get_current_user)):
    if user.get("balance", 0) < 0.02:
        raise HTTPException(status_code=400, detail="رصيد غير كافٍ")
    
    if not twilio_client:
        raise HTTPException(status_code=500, detail="خدمة الرسائل غير متوفرة")
    
    try:
        to_number = msg_data.to_number
        if not to_number.startswith("+"):
            to_number = "+" + to_number
        
        # Send via Twilio
        message = twilio_client.messages.create(
            body=msg_data.body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        
        # Save message
        msg = Message(
            user_id=user["id"],
            to_number=to_number,
            body=msg_data.body,
            status=message.status
        )
        await db.messages.insert_one(msg.dict())
        
        # Deduct balance
        sms_cost = 0.02
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"balance": -sms_cost}}
        )
        
        # Add transaction
        trans = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": "sms",
            "amount": -sms_cost,
            "description": f"رسالة إلى {to_number}",
            "created_at": datetime.utcnow()
        }
        await db.transactions.insert_one(trans)
        
        return msg
        
    except TwilioRestException as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"خطأ: {str(e)}")

@api_router.get("/messages", response_model=List[Message])
async def get_messages(user=Depends(get_current_user)):
    messages = await db.messages.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [Message(**m) for m in messages]

# ============= Balance & Transaction Routes =============

@api_router.post("/balance/topup")
async def topup_balance(topup_req: TopupRequest, user=Depends(get_current_user)):
    # In production, this would be called after payment verification
    amount = topup_req.amount
    
    # Add bonus for $49.99+
    bonus = 10.0 if amount >= 49.99 else 0
    total = amount + bonus
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"balance": total}}
    )
    
    # Add transaction
    trans = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "topup",
        "amount": total,
        "description": f"شحن رصيد ${amount}" + (f" + مكافأة ${bonus}" if bonus > 0 else ""),
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(trans)
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user["id"]})
    
    return {
        "message": "تم الشحن بنجاح",
        "new_balance": updated_user["balance"],
        "amount_added": total
    }

@api_router.post("/balance/transfer")
async def transfer_balance(transfer_req: TransferRequest, user=Depends(get_current_user)):
    if user.get("balance", 0) < transfer_req.amount:
        raise HTTPException(status_code=400, detail="رصيد غير كافٍ")
    
    # Deduct from sender
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"balance": -transfer_req.amount}}
    )
    
    # Add transaction for sender
    trans = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "transfer_out",
        "amount": -transfer_req.amount,
        "description": f"تحويل إلى {transfer_req.to_number}",
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(trans)
    
    # Get updated balance
    updated_user = await db.users.find_one({"id": user["id"]})
    
    return {
        "message": "تم التحويل بنجاح",
        "new_balance": updated_user["balance"]
    }

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user=Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [Transaction(**t) for t in transactions]

# ============= Rate Routes =============

@api_router.post("/rates/check", response_model=RateResponse)
async def check_rate(rate_req: RateCheckRequest):
    rate_info = get_rate_for_number(rate_req.phone_number)
    return RateResponse(
        country=rate_info["country"],
        rate_per_minute=rate_info["rate"]
    )

# ============= DTMF Route =============

@api_router.post("/calls/dtmf/{call_sid}")
async def send_dtmf(call_sid: str, digits: str, user=Depends(get_current_user)):
    if not twilio_client:
        raise HTTPException(status_code=500, detail="خدمة الاتصال غير متوفرة")
    
    try:
        # Send DTMF tones
        call = twilio_client.calls(call_sid).update(
            twiml=f'<Response><Play digits="{digits}"/></Response>'
        )
        return {"message": "تم إرسال الأرقام", "digits": digits}
    except TwilioRestException as e:
        logger.error(f"Twilio error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"خطأ: {str(e)}")

# ============= Twilio Token Route (for Web SDK) =============

@api_router.get("/token")
async def get_twilio_token(identity: str = None):
    """Generate a Twilio capability token for the JavaScript SDK"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="Twilio not configured")
    
    # Create capability token
    capability = ClientCapabilityToken(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    # Allow outgoing calls using the TwiML App
    capability.allow_client_outgoing(TWILIO_TWIML_APP_SID)
    
    # Allow incoming calls to this identity
    if identity:
        capability.allow_client_incoming(identity)
    
    token = capability.to_jwt()
    
    return PlainTextResponse(content=token.decode() if isinstance(token, bytes) else token)

@api_router.get("/calling-page", response_class=HTMLResponse)
async def get_calling_page():
    """Serve the Twilio calling HTML page"""
    template_path = ROOT_DIR / "templates" / "calling.html"
    if template_path.exists():
        return HTMLResponse(content=template_path.read_text())
    raise HTTPException(status_code=404, detail="Calling page not found")

@api_router.post("/twiml/voice", response_class=PlainTextResponse)
async def twiml_voice(To: str = None, CustomDisplayName: str = None, callerId: str = None):
    """TwiML endpoint for outgoing calls"""
    response = VoiceResponse()
    
    if To:
        dial = Dial(callerId=callerId or TWILIO_PHONE_NUMBER)
        dial.number(To)
        response.append(dial)
    else:
        response.say("مرحباً، رقم غير صالح", voice='alice', language='ar')
    
    return PlainTextResponse(content=str(response), media_type="application/xml")

@api_router.post("/setup-user")
async def setup_user(data: dict):
    """Setup user from Firebase - create in MongoDB if needed"""
    uid = data.get("uid")
    email = data.get("email")
    
    if not uid or not email:
        raise HTTPException(status_code=400, detail="Missing uid or email")
    
    # Check if user exists
    existing = await db.users.find_one({"firebase_uid": uid})
    
    if not existing:
        # Create new user
        user = {
            "id": uid,
            "firebase_uid": uid,
            "email": email,
            "balance": 1.00,
            "virtual_number": TWILIO_PHONE_NUMBER,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(user)
        
        # Create welcome transaction
        trans = {
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "type": "bonus",
            "amount": 1.00,
            "description": "رصيد ترحيبي مجاني",
            "created_at": datetime.utcnow()
        }
        await db.transactions.insert_one(trans)
    
    return {"status": "ok", "uid": uid}

# ============= Health Check =============

@api_router.get("/")
async def root():
    return {"message": "Abu Al-Zahra VoIP API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "twilio_configured": twilio_client is not None,
        "database": "connected"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
