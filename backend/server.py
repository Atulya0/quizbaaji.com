from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv
import motor.motor_asyncio
from supabase import create_client, Client
import stripe
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import secrets
import json
from typing import Optional, List, Dict, Any
import asyncio
import logging
from bson import ObjectId
import uuid

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="QuizBaaji API", description="Quiz Tournament Platform", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/quizbaaji")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.quizbaaji

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Optional[Client] = None

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Supabase initialization error: {e}")
    supabase = None

# Stripe setup
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# WebSocket manager for real-time features
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# Sample data creation
async def create_sample_data():
    """Create sample tournaments and questions"""
    try:
        # Check if sample data already exists
        existing_questions = await db.questions.count_documents({})
        if existing_questions > 0:
            return
        
        # Sample questions
        sample_questions = [
            {
                "_id": ObjectId(),
                "category": "general",
                "question_text": "What is the capital of India?",
                "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
                "correct_answer": 1,
                "explanation": "New Delhi is the capital of India.",
                "difficulty": "easy",
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "category": "science",
                "question_text": "What is the chemical symbol for water?",
                "options": ["H2O", "CO2", "NaCl", "O2"],
                "correct_answer": 0,
                "explanation": "H2O is the chemical formula for water.",
                "difficulty": "easy",
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "category": "history",
                "question_text": "In which year did India gain independence?",
                "options": ["1945", "1947", "1950", "1952"],
                "correct_answer": 1,
                "explanation": "India gained independence on August 15, 1947.",
                "difficulty": "medium",
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "category": "sports",
                "question_text": "How many players are there in a cricket team?",
                "options": ["10", "11", "12", "13"],
                "correct_answer": 1,
                "explanation": "A cricket team has 11 players.",
                "difficulty": "easy",
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "category": "entertainment",
                "question_text": "Who directed the movie 'Sholay'?",
                "options": ["Ramesh Sippy", "Yash Chopra", "Raj Kapoor", "Guru Dutt"],
                "correct_answer": 0,
                "explanation": "Ramesh Sippy directed the classic movie 'Sholay'.",
                "difficulty": "medium",
                "created_at": datetime.utcnow(),
                "created_by": "system"
            }
        ]
        
        # Add more questions for each category
        categories = ["general", "science", "history", "sports", "entertainment"]
        for category in categories:
            for i in range(30):  # Add 30 questions per category
                question = {
                    "_id": ObjectId(),
                    "category": category,
                    "question_text": f"Sample {category} question {i+1}. What is the correct answer?",
                    "options": [
                        f"Option A for {category} {i+1}",
                        f"Option B for {category} {i+1}",
                        f"Option C for {category} {i+1}",
                        f"Option D for {category} {i+1}"
                    ],
                    "correct_answer": i % 4,  # Randomize correct answers
                    "explanation": f"This is the explanation for {category} question {i+1}.",
                    "difficulty": ["easy", "medium", "hard"][i % 3],
                    "created_at": datetime.utcnow(),
                    "created_by": "system"
                }
                sample_questions.append(question)
        
        await db.questions.insert_many(sample_questions)
        
        # Sample tournaments
        sample_tournaments = [
            {
                "_id": ObjectId(),
                "name": "General Knowledge Championship",
                "description": "Test your general knowledge with exciting questions",
                "category": "general",
                "entry_fee": 39.0,
                "prize_pool": 1000.0,
                "max_participants": 100,
                "start_time": datetime.utcnow() + timedelta(hours=1),
                "end_time": datetime.utcnow() + timedelta(hours=2),
                "duration_minutes": 5,
                "questions_count": 30,
                "status": "upcoming",
                "participants": [],
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Science Quiz Battle",
                "description": "Challenge yourself with science questions",
                "category": "science",
                "entry_fee": 49.0,
                "prize_pool": 1500.0,
                "max_participants": 50,
                "start_time": datetime.utcnow() + timedelta(hours=2),
                "end_time": datetime.utcnow() + timedelta(hours=3),
                "duration_minutes": 5,
                "questions_count": 30,
                "status": "upcoming",
                "participants": [],
                "created_at": datetime.utcnow(),
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Sports Trivia Challenge",
                "description": "Show your sports knowledge",
                "category": "sports",
                "entry_fee": 29.0,
                "prize_pool": 800.0,
                "max_participants": 75,
                "start_time": datetime.utcnow() + timedelta(hours=3),
                "end_time": datetime.utcnow() + timedelta(hours=4),
                "duration_minutes": 5,
                "questions_count": 30,
                "status": "upcoming",
                "participants": [],
                "created_at": datetime.utcnow(),
                "created_by": "system"
            }
        ]
        
        await db.tournaments.insert_many(sample_tournaments)
        print("Sample data created successfully")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")

# Database initialization
async def init_db():
    """Initialize database with indexes and admin user"""
    try:
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("google_id", unique=True, sparse=True)
        await db.tournaments.create_index("start_time")
        await db.tournaments.create_index("category")
        await db.questions.create_index("category")
        await db.quiz_sessions.create_index("user_id")
        await db.quiz_sessions.create_index("tournament_id")
        
        # Create admin user if not exists
        admin_email = os.getenv("ADMIN_EMAIL", "admin@quizbaaji.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            admin_user = {
                "_id": ObjectId(),
                "email": admin_email,
                "password": pwd_context.hash(admin_password),
                "name": "Admin",
                "role": "admin",
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "wallet_balance": 0.0,
                "kyc_verified": True
            }
            await db.users.insert_one(admin_user)
            print(f"Admin user created: {admin_email}")
        
        # Create sample data
        await create_sample_data()
        
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_db()

# Include routers
from quiz_routes import router as quiz_router
from admin_routes import router as admin_router

app.include_router(quiz_router)
app.include_router(admin_router)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints
@app.post("/api/auth/google")
async def google_auth(request: Request):
    """Handle Google OAuth authentication"""
    try:
        body = await request.json()
        google_token = body.get("token")
        
        if not google_token:
            raise HTTPException(status_code=400, detail="Google token required")
        
        # Verify Google token (simplified - implement proper verification)
        # For now, we'll create a mock user
        user_data = {
            "email": body.get("email"),
            "name": body.get("name"),
            "google_id": body.get("google_id"),
            "avatar": body.get("avatar")
        }
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            user_id = str(existing_user["_id"])
        else:
            # Create new user
            new_user = {
                "_id": ObjectId(),
                "email": user_data["email"],
                "name": user_data["name"],
                "google_id": user_data["google_id"],
                "avatar": user_data.get("avatar"),
                "role": "user",
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "wallet_balance": 100.0,  # Give new users ₹100 bonus
                "kyc_verified": False
            }
            await db.users.insert_one(new_user)
            user_id = str(new_user["_id"])
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user_id, "email": user_data["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# User endpoints
@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user_profile = {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user["name"],
        "avatar": current_user.get("avatar"),
        "wallet_balance": current_user.get("wallet_balance", 0.0),
        "kyc_verified": current_user.get("kyc_verified", False),
        "role": current_user.get("role", "user")
    }
    return user_profile

@app.put("/api/user/kyc")
async def update_kyc(request: Request, current_user: dict = Depends(get_current_user)):
    """Update KYC information"""
    try:
        body = await request.json()
        
        kyc_data = {
            "full_name": body.get("full_name"),
            "phone": body.get("phone"),
            "address": body.get("address"),
            "document_type": body.get("document_type"),
            "document_number": body.get("document_number"),
            "document_front": body.get("document_front"),
            "document_back": body.get("document_back"),
            "kyc_status": "pending",
            "submitted_at": datetime.utcnow()
        }
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"kyc_data": kyc_data}}
        )
        
        return {"message": "KYC information submitted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Tournament endpoints
@app.get("/api/tournaments")
async def get_tournaments():
    """Get all active tournaments"""
    try:
        tournaments = await db.tournaments.find({
            "status": {"$in": ["upcoming", "active"]},
            "start_time": {"$gt": datetime.utcnow() - timedelta(hours=1)}
        }).to_list(length=100)
        
        # Convert ObjectId to string
        for tournament in tournaments:
            tournament["_id"] = str(tournament["_id"])
        
        return tournaments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tournaments/{tournament_id}/join")
async def join_tournament(tournament_id: str, current_user: dict = Depends(get_current_user)):
    """Join a tournament"""
    try:
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if user already joined
        existing_entry = await db.tournament_entries.find_one({
            "tournament_id": ObjectId(tournament_id),
            "user_id": current_user["_id"]
        })
        
        if existing_entry:
            raise HTTPException(status_code=400, detail="Already joined tournament")
        
        # Check wallet balance
        entry_fee = tournament["entry_fee"]
        if current_user["wallet_balance"] < entry_fee:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        
        # Deduct entry fee from wallet
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$inc": {"wallet_balance": -entry_fee}}
        )
        
        # Create tournament entry
        entry = {
            "_id": ObjectId(),
            "tournament_id": ObjectId(tournament_id),
            "user_id": current_user["_id"],
            "entry_fee": entry_fee,
            "joined_at": datetime.utcnow(),
            "quiz_session_id": None,
            "final_score": None,
            "rank": None,
            "prize_amount": None
        }
        
        await db.tournament_entries.insert_one(entry)
        
        # Add participant to tournament
        await db.tournaments.update_one(
            {"_id": ObjectId(tournament_id)},
            {"$push": {"participants": str(current_user["_id"])}}
        )
        
        return {"message": "Tournament joined successfully", "entry_id": str(entry["_id"])}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time updates
@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages
            await manager.send_personal_message(f"Echo: {data}", user_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)