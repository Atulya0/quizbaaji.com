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
from websocket_manager import websocket_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="QuizBaaji API", 
    description="Quiz Tournament Platform with Real-time Features", 
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Supabase initialization error: {e}")
    supabase = None

# Stripe setup
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    logger.info("Stripe configured successfully")
else:
    logger.warning("Stripe not configured - payment features will be disabled")

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# App configuration
QUIZ_DURATION_MINUTES = int(os.getenv("QUIZ_DURATION_MINUTES", "5"))
QUESTIONS_PER_QUIZ = int(os.getenv("QUESTIONS_PER_QUIZ", "30"))
QUESTION_TIME_SECONDS = int(os.getenv("QUESTION_TIME_SECONDS", "5"))
ENTRY_FEE_RUPEES = int(os.getenv("ENTRY_FEE_RUPEES", "39"))

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        # If ObjectId fails, try as string (for compatibility)
        user = await db.users.find_one({"_id": user_id})
    
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
            logger.info("Sample data already exists")
            return
        
        # Enhanced sample questions with better variety
        categories = {
            "general": [
                {
                    "question_text": "What is the capital of India?",
                    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
                    "correct_answer": 1,
                    "explanation": "New Delhi is the capital city of India.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Which is the largest ocean in the world?",
                    "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                    "correct_answer": 3,
                    "explanation": "The Pacific Ocean is the largest ocean covering about 63 million square miles.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "How many continents are there in the world?",
                    "options": ["5", "6", "7", "8"],
                    "correct_answer": 2,
                    "explanation": "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.",
                    "difficulty": "easy"
                }
            ],
            "science": [
                {
                    "question_text": "What is the chemical symbol for water?",
                    "options": ["H2O", "CO2", "NaCl", "O2"],
                    "correct_answer": 0,
                    "explanation": "H2O represents water molecule with 2 hydrogen atoms and 1 oxygen atom.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "What is the speed of light in vacuum?",
                    "options": ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
                    "correct_answer": 0,
                    "explanation": "The speed of light in vacuum is approximately 299,792,458 meters per second or about 300,000 km/s.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "Which gas makes up about 78% of Earth's atmosphere?",
                    "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
                    "correct_answer": 2,
                    "explanation": "Nitrogen makes up about 78% of Earth's atmosphere, while oxygen is about 21%.",
                    "difficulty": "medium"
                }
            ],
            "history": [
                {
                    "question_text": "In which year did India gain independence?",
                    "options": ["1945", "1947", "1950", "1952"],
                    "correct_answer": 1,
                    "explanation": "India gained independence from British rule on August 15, 1947.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Who was the first President of India?",
                    "options": ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "Dr. A.P.J. Abdul Kalam", "Dr. Sarvepalli Radhakrishnan"],
                    "correct_answer": 1,
                    "explanation": "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "The Battle of Plassey was fought in which year?",
                    "options": ["1757", "1764", "1771", "1780"],
                    "correct_answer": 0,
                    "explanation": "The Battle of Plassey was fought on June 23, 1757, marking the beginning of British rule in India.",
                    "difficulty": "hard"
                }
            ],
            "sports": [
                {
                    "question_text": "How many players are there in a cricket team?",
                    "options": ["10", "11", "12", "13"],
                    "correct_answer": 1,
                    "explanation": "A cricket team consists of 11 players on the field at any given time.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "In which sport is the term 'slam dunk' used?",
                    "options": ["Football", "Basketball", "Tennis", "Volleyball"],
                    "correct_answer": 1,
                    "explanation": "Slam dunk is a basketball term where a player jumps and scores by putting the ball directly through the basket.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Which country hosted the 2016 Summer Olympics?",
                    "options": ["China", "UK", "Brazil", "Japan"],
                    "correct_answer": 2,
                    "explanation": "Brazil hosted the 2016 Summer Olympics in Rio de Janeiro.",
                    "difficulty": "medium"
                }
            ],
            "entertainment": [
                {
                    "question_text": "Who directed the movie 'Sholay'?",
                    "options": ["Ramesh Sippy", "Yash Chopra", "Raj Kapoor", "Guru Dutt"],
                    "correct_answer": 0,
                    "explanation": "Ramesh Sippy directed the classic Bollywood movie 'Sholay' released in 1975.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "Which movie won the first Academy Award for Best Picture?",
                    "options": ["Wings", "Sunrise", "The Jazz Singer", "Metropolis"],
                    "correct_answer": 0,
                    "explanation": "Wings (1927) won the first Academy Award for Best Picture at the 1st Academy Awards ceremony.",
                    "difficulty": "hard"
                },
                {
                    "question_text": "Who composed the music for the movie 'Titanic'?",
                    "options": ["Hans Zimmer", "John Williams", "James Horner", "Danny Elfman"],
                    "correct_answer": 2,
                    "explanation": "James Horner composed the music for Titanic, including the famous song 'My Heart Will Go On'.",
                    "difficulty": "medium"
                }
            ]
        }
        
        sample_questions = []
        
        # Create enhanced questions for each category
        for category, base_questions in categories.items():
            # Add the base questions
            for q in base_questions:
                question = {
                    "_id": ObjectId(),
                    "category": category,
                    "question_text": q["question_text"],
                    "options": q["options"],
                    "correct_answer": q["correct_answer"],
                    "explanation": q["explanation"],
                    "difficulty": q["difficulty"],
                    "created_at": datetime.utcnow(),
                    "created_by": "system"
                }
                sample_questions.append(question)
            
            # Generate additional questions to reach 50 per category
            for i in range(len(base_questions), 50):
                question = {
                    "_id": ObjectId(),
                    "category": category,
                    "question_text": f"Sample {category} question {i+1}. What is the most appropriate answer?",
                    "options": [
                        f"Option A for {category} question {i+1}",
                        f"Option B for {category} question {i+1}",
                        f"Option C for {category} question {i+1}",
                        f"Option D for {category} question {i+1}"
                    ],
                    "correct_answer": i % 4,  # Randomize correct answers
                    "explanation": f"This is the explanation for {category} question {i+1}. The correct answer provides the most accurate information.",
                    "difficulty": ["easy", "medium", "hard"][i % 3],
                    "created_at": datetime.utcnow(),
                    "created_by": "system"
                }
                sample_questions.append(question)
        
        await db.questions.insert_many(sample_questions)
        logger.info(f"Created {len(sample_questions)} sample questions")
        
        # Enhanced sample tournaments
        now = datetime.utcnow()
        sample_tournaments = [
            {
                "_id": ObjectId(),
                "name": "General Knowledge Championship",
                "description": "Test your general knowledge with exciting questions from various topics",
                "category": "general",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1000.0,
                "max_participants": 100,
                "start_time": now + timedelta(minutes=5),
                "end_time": now + timedelta(hours=2),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Science Quiz Battle",
                "description": "Challenge yourself with fascinating science questions",
                "category": "science",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1500.0,
                "max_participants": 75,
                "start_time": now + timedelta(hours=1),
                "end_time": now + timedelta(hours=3),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "History Masters",
                "description": "Dive deep into historical events and personalities",
                "category": "history",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1200.0,
                "max_participants": 50,
                "start_time": now + timedelta(hours=2),
                "end_time": now + timedelta(hours=4),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Sports Trivia Challenge",
                "description": "Show your sports knowledge across different games",
                "category": "sports",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 800.0,
                "max_participants": 60,
                "start_time": now + timedelta(hours=3),
                "end_time": now + timedelta(hours=5),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Entertainment Quiz Night",
                "description": "Test your knowledge of movies, music, and pop culture",
                "category": "entertainment",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 900.0,
                "max_participants": 80,
                "start_time": now + timedelta(hours=4),
                "end_time": now + timedelta(hours=6),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            }
        ]
        
        await db.tournaments.insert_many(sample_tournaments)
        logger.info(f"Created {len(sample_tournaments)} sample tournaments")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {e}")

# Database initialization
async def init_db():
    """Initialize database with indexes and admin user"""
    try:
        # Create indexes for better performance
        await db.users.create_index("email", unique=True)
        await db.users.create_index("google_id", unique=True, sparse=True)
        await db.tournaments.create_index("start_time")
        await db.tournaments.create_index("category")
        await db.tournaments.create_index("status")
        await db.questions.create_index("category")
        await db.quiz_sessions.create_index("user_id")
        await db.quiz_sessions.create_index("tournament_id")
        await db.payments.create_index("payment_intent_id", unique=True)
        await db.payments.create_index("user_id")
        await db.wallet_transactions.create_index("user_id")
        await db.tournament_entries.create_index([("tournament_id", 1), ("user_id", 1)], unique=True)
        
        logger.info("Database indexes created successfully")
        
        # Create admin user if not exists
        admin_email = os.getenv("ADMIN_EMAIL", "admin@quizbaaji.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            admin_user = {
                "_id": ObjectId(),
                "email": admin_email,
                "password": pwd_context.hash(admin_password),
                "name": "QuizBaaji Admin",
                "role": "admin",
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "wallet_balance": 0.0,
                "kyc_verified": True,
                "kyc_data": None
            }
            await db.users.insert_one(admin_user)
            logger.info(f"Admin user created: {admin_email}")
        
        # Create sample data
        await create_sample_data()
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("QuizBaaji API started successfully")

# Include routers
from quiz_routes import router as quiz_router
from admin_routes import router as admin_router
from payment_routes import router as payment_router

app.include_router(quiz_router)
app.include_router(admin_router)
app.include_router(payment_router)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "stripe": "configured" if STRIPE_SECRET_KEY else "not configured",
            "supabase": "connected" if supabase else "not configured"
        }
    }

# Authentication endpoints
@app.post("/api/auth/google")
async def google_auth(request: Request):
    """Handle Google OAuth authentication"""
    try:
        body = await request.json()
        google_token = body.get("token")
        
        if not google_token:
            raise HTTPException(status_code=400, detail="Google token required")
        
        # For now, we'll create user based on provided data
        # In production, verify the Google token properly
        user_data = {
            "email": body.get("email"),
            "name": body.get("name"),
            "google_id": body.get("google_id"),
            "avatar": body.get("avatar")
        }
        
        if not user_data["email"]:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            user_id = str(existing_user["_id"])
            # Update last login
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
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
                "last_login": datetime.utcnow(),
                "wallet_balance": 100.0,  # Welcome bonus of ₹100
                "kyc_verified": False,
                "kyc_data": None
            }
            await db.users.insert_one(new_user)
            user_id = str(new_user["_id"])
            
            # Create welcome transaction
            welcome_transaction = {
                "_id": ObjectId(),
                "user_id": new_user["_id"],
                "type": "credit",
                "amount": 100.0,
                "description": "Welcome bonus for new user",
                "created_at": datetime.utcnow()
            }
            await db.wallet_transactions.insert_one(welcome_transaction)
            
            logger.info(f"New user created: {user_data['email']}")
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user_id, "email": user_data["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        logger.error(f"Google auth error: {e}")
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
        "role": current_user.get("role", "user"),
        "created_at": current_user.get("created_at"),
        "last_login": current_user.get("last_login")
    }
# Include the rest of the functions and startup event
from websocket_manager import websocket_manager

# Sample data creation
async def create_sample_data():
    """Create sample tournaments and questions"""
    try:
        # Check if sample data already exists
        existing_questions = await db.questions.count_documents({})
        if existing_questions > 0:
            logger.info("Sample data already exists")
            return
        
        # Enhanced sample questions with better variety
        categories = {
            "general": [
                {
                    "question_text": "What is the capital of India?",
                    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
                    "correct_answer": 1,
                    "explanation": "New Delhi is the capital city of India.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Which is the largest ocean in the world?",
                    "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                    "correct_answer": 3,
                    "explanation": "The Pacific Ocean is the largest ocean covering about 63 million square miles.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "How many continents are there in the world?",
                    "options": ["5", "6", "7", "8"],
                    "correct_answer": 2,
                    "explanation": "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.",
                    "difficulty": "easy"
                }
            ],
            "science": [
                {
                    "question_text": "What is the chemical symbol for water?",
                    "options": ["H2O", "CO2", "NaCl", "O2"],
                    "correct_answer": 0,
                    "explanation": "H2O represents water molecule with 2 hydrogen atoms and 1 oxygen atom.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "What is the speed of light in vacuum?",
                    "options": ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
                    "correct_answer": 0,
                    "explanation": "The speed of light in vacuum is approximately 299,792,458 meters per second or about 300,000 km/s.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "Which gas makes up about 78% of Earth's atmosphere?",
                    "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
                    "correct_answer": 2,
                    "explanation": "Nitrogen makes up about 78% of Earth's atmosphere, while oxygen is about 21%.",
                    "difficulty": "medium"
                }
            ],
            "history": [
                {
                    "question_text": "In which year did India gain independence?",
                    "options": ["1945", "1947", "1950", "1952"],
                    "correct_answer": 1,
                    "explanation": "India gained independence from British rule on August 15, 1947.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Who was the first President of India?",
                    "options": ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "Dr. A.P.J. Abdul Kalam", "Dr. Sarvepalli Radhakrishnan"],
                    "correct_answer": 1,
                    "explanation": "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "The Battle of Plassey was fought in which year?",
                    "options": ["1757", "1764", "1771", "1780"],
                    "correct_answer": 0,
                    "explanation": "The Battle of Plassey was fought on June 23, 1757, marking the beginning of British rule in India.",
                    "difficulty": "hard"
                }
            ],
            "sports": [
                {
                    "question_text": "How many players are there in a cricket team?",
                    "options": ["10", "11", "12", "13"],
                    "correct_answer": 1,
                    "explanation": "A cricket team consists of 11 players on the field at any given time.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "In which sport is the term 'slam dunk' used?",
                    "options": ["Football", "Basketball", "Tennis", "Volleyball"],
                    "correct_answer": 1,
                    "explanation": "Slam dunk is a basketball term where a player jumps and scores by putting the ball directly through the basket.",
                    "difficulty": "easy"
                },
                {
                    "question_text": "Which country hosted the 2016 Summer Olympics?",
                    "options": ["China", "UK", "Brazil", "Japan"],
                    "correct_answer": 2,
                    "explanation": "Brazil hosted the 2016 Summer Olympics in Rio de Janeiro.",
                    "difficulty": "medium"
                }
            ],
            "entertainment": [
                {
                    "question_text": "Who directed the movie 'Sholay'?",
                    "options": ["Ramesh Sippy", "Yash Chopra", "Raj Kapoor", "Guru Dutt"],
                    "correct_answer": 0,
                    "explanation": "Ramesh Sippy directed the classic Bollywood movie 'Sholay' released in 1975.",
                    "difficulty": "medium"
                },
                {
                    "question_text": "Which movie won the first Academy Award for Best Picture?",
                    "options": ["Wings", "Sunrise", "The Jazz Singer", "Metropolis"],
                    "correct_answer": 0,
                    "explanation": "Wings (1927) won the first Academy Award for Best Picture at the 1st Academy Awards ceremony.",
                    "difficulty": "hard"
                },
                {
                    "question_text": "Who composed the music for the movie 'Titanic'?",
                    "options": ["Hans Zimmer", "John Williams", "James Horner", "Danny Elfman"],
                    "correct_answer": 2,
                    "explanation": "James Horner composed the music for Titanic, including the famous song 'My Heart Will Go On'.",
                    "difficulty": "medium"
                }
            ]
        }
        
        sample_questions = []
        
        # Create enhanced questions for each category
        for category, base_questions in categories.items():
            # Add the base questions
            for q in base_questions:
                question = {
                    "_id": ObjectId(),
                    "category": category,
                    "question_text": q["question_text"],
                    "options": q["options"],
                    "correct_answer": q["correct_answer"],
                    "explanation": q["explanation"],
                    "difficulty": q["difficulty"],
                    "created_at": datetime.utcnow(),
                    "created_by": "system"
                }
                sample_questions.append(question)
            
            # Generate additional questions to reach 50 per category
            for i in range(len(base_questions), 50):
                question = {
                    "_id": ObjectId(),
                    "category": category,
                    "question_text": f"Sample {category} question {i+1}. What is the most appropriate answer?",
                    "options": [
                        f"Option A for {category} question {i+1}",
                        f"Option B for {category} question {i+1}",
                        f"Option C for {category} question {i+1}",
                        f"Option D for {category} question {i+1}"
                    ],
                    "correct_answer": i % 4,  # Randomize correct answers
                    "explanation": f"This is the explanation for {category} question {i+1}. The correct answer provides the most accurate information.",
                    "difficulty": ["easy", "medium", "hard"][i % 3],
                    "created_at": datetime.utcnow(),
                    "created_by": "system"
                }
                sample_questions.append(question)
        
        await db.questions.insert_many(sample_questions)
        logger.info(f"Created {len(sample_questions)} sample questions")
        
        # Enhanced sample tournaments
        now = datetime.utcnow()
        sample_tournaments = [
            {
                "_id": ObjectId(),
                "name": "General Knowledge Championship",
                "description": "Test your general knowledge with exciting questions from various topics",
                "category": "general",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1000.0,
                "max_participants": 100,
                "start_time": now + timedelta(minutes=5),
                "end_time": now + timedelta(hours=2),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Science Quiz Battle",
                "description": "Challenge yourself with fascinating science questions",
                "category": "science",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1500.0,
                "max_participants": 75,
                "start_time": now + timedelta(hours=1),
                "end_time": now + timedelta(hours=3),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "History Masters",
                "description": "Dive deep into historical events and personalities",
                "category": "history",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 1200.0,
                "max_participants": 50,
                "start_time": now + timedelta(hours=2),
                "end_time": now + timedelta(hours=4),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Sports Trivia Challenge",
                "description": "Show your sports knowledge across different games",
                "category": "sports",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 800.0,
                "max_participants": 60,
                "start_time": now + timedelta(hours=3),
                "end_time": now + timedelta(hours=5),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            },
            {
                "_id": ObjectId(),
                "name": "Entertainment Quiz Night",
                "description": "Test your knowledge of movies, music, and pop culture",
                "category": "entertainment",
                "entry_fee": float(ENTRY_FEE_RUPEES),
                "prize_pool": 900.0,
                "max_participants": 80,
                "start_time": now + timedelta(hours=4),
                "end_time": now + timedelta(hours=6),
                "duration_minutes": QUIZ_DURATION_MINUTES,
                "questions_count": QUESTIONS_PER_QUIZ,
                "status": "upcoming",
                "participants": [],
                "created_at": now,
                "created_by": "system"
            }
        ]
        
        await db.tournaments.insert_many(sample_tournaments)
        logger.info(f"Created {len(sample_tournaments)} sample tournaments")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {e}")

# Database initialization
async def init_db():
    """Initialize database with indexes and admin user"""
    try:
        # Create indexes for better performance
        await db.users.create_index("email", unique=True)
        await db.users.create_index("google_id", unique=True, sparse=True)
        await db.tournaments.create_index("start_time")
        await db.tournaments.create_index("category")
        await db.tournaments.create_index("status")
        await db.questions.create_index("category")
        await db.quiz_sessions.create_index("user_id")
        await db.quiz_sessions.create_index("tournament_id")
        await db.payments.create_index("payment_intent_id", unique=True)
        await db.payments.create_index("user_id")
        await db.wallet_transactions.create_index("user_id")
        await db.tournament_entries.create_index([("tournament_id", 1), ("user_id", 1)], unique=True)
        
        logger.info("Database indexes created successfully")
        
        # Create admin user if not exists
        admin_email = os.getenv("ADMIN_EMAIL", "admin@quizbaaji.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            admin_user = {
                "_id": ObjectId(),
                "email": admin_email,
                "password": pwd_context.hash(admin_password),
                "name": "QuizBaaji Admin",
                "role": "admin",
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "wallet_balance": 0.0,
                "kyc_verified": True,
                "kyc_data": None
            }
            await db.users.insert_one(admin_user)
            logger.info(f"Admin user created: {admin_email}")
        
        # Create sample data
        await create_sample_data()
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("QuizBaaji API started successfully")

# Include routers
from quiz_routes import router as quiz_router
from admin_routes import router as admin_router
from payment_routes import router as payment_router

app.include_router(quiz_router)
app.include_router(admin_router)
app.include_router(payment_router)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "stripe": "configured" if STRIPE_SECRET_KEY else "not configured",
            "supabase": "connected" if supabase else "not configured"
        }
    }

@app.put("/api/user/kyc")
async def update_kyc(request: Request, current_user: dict = Depends(get_current_user)):
    """Update KYC information"""
    try:
        body = await request.json()
        
        required_fields = ["full_name", "phone", "address", "document_type", "document_number"]
        for field in required_fields:
            if not body.get(field):
                raise HTTPException(status_code=400, detail=f"{field} is required")
        
        kyc_data = {
            "full_name": body["full_name"],
            "phone": body["phone"],
            "address": body["address"],
            "document_type": body["document_type"],
            "document_number": body["document_number"],
            "document_front": body.get("document_front"),
            "document_back": body.get("document_back"),
            "kyc_status": "pending",
            "submitted_at": datetime.utcnow()
        }
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"kyc_data": kyc_data}}
        )
        
        # Notify admins about new KYC submission
        await websocket_manager.broadcast_to_admins({
            "type": "kyc_submission",
            "user_id": str(current_user["_id"]),
            "user_email": current_user["email"],
            "user_name": current_user["name"],
            "submitted_at": datetime.utcnow().isoformat()
        })
        
        return {"message": "KYC information submitted successfully"}
        
    except Exception as e:
        logger.error(f"KYC update error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Tournament endpoints
@app.get("/api/tournaments")
async def get_tournaments():
    """Get all active tournaments"""
    try:
        now = datetime.utcnow()
        tournaments = await db.tournaments.find({
            "status": {"$in": ["upcoming", "active"]},
            "end_time": {"$gt": now}
        }).sort("start_time", 1).to_list(length=100)
        
        # Convert ObjectId to string and add participant count
        for tournament in tournaments:
            tournament["_id"] = str(tournament["_id"])
            tournament["participant_count"] = len(tournament.get("participants", []))
            
            # Update status based on time
            if now >= tournament["start_time"] and now <= tournament["end_time"]:
                if tournament["status"] == "upcoming":
                    await db.tournaments.update_one(
                        {"_id": ObjectId(tournament["_id"])},
                        {"$set": {"status": "active"}}
                    )
                    tournament["status"] = "active"
        
        return tournaments
        
    except Exception as e:
        logger.error(f"Get tournaments error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tournaments/{tournament_id}")
async def get_tournament_details(tournament_id: str):
    """Get detailed tournament information"""
    try:
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        tournament["_id"] = str(tournament["_id"])
        tournament["participant_count"] = len(tournament.get("participants", []))
        
        return tournament
        
    except Exception as e:
        logger.error(f"Get tournament details error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time features
@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time communication"""
    try:
        # Get user info to determine role
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            await websocket.close(code=4004, reason="User not found")
            return
        
        user_role = user.get("role", "user")
        await websocket_manager.connect_user(websocket, user_id, user_role)
        
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                message_type = message.get("type")
                
                if message_type == "join_tournament":
                    tournament_id = message.get("tournament_id")
                    if tournament_id:
                        await websocket_manager.join_tournament_room(user_id, tournament_id)
                
                elif message_type == "leave_tournament":
                    tournament_id = message.get("tournament_id")
                    if tournament_id:
                        await websocket_manager.leave_tournament_room(user_id, tournament_id)
                
                elif message_type == "ping":
                    # Send pong response
                    await websocket_manager.send_to_user(user_id, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                # Invalid JSON received
                await websocket_manager.send_to_user(user_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                logger.error(f"WebSocket message error: {e}")
                await websocket_manager.send_to_user(user_id, {
                    "type": "error",
                    "message": "Internal server error"
                })
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        await websocket_manager.disconnect_user(user_id)

# Real-time stats endpoint
@app.get("/api/stats/realtime")
async def get_realtime_stats():
    """Get real-time platform statistics"""
    try:
        now = datetime.utcnow()
        
        # Get various counts
        total_users = await db.users.count_documents({})
        active_tournaments = await db.tournaments.count_documents({
            "status": "active",
            "end_time": {"$gt": now}
        })
        total_questions = await db.questions.count_documents({})
        ongoing_quizzes = websocket_manager.get_active_quiz_sessions_count()
        online_users = websocket_manager.get_active_users_count()
        
        # Calculate total revenue (simplified)
        total_payments = await db.payments.aggregate([
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        
        total_revenue = total_payments[0]["total"] if total_payments else 0
        
        return {
            "total_users": total_users,
            "active_tournaments": active_tournaments,
            "total_questions": total_questions,
            "ongoing_quizzes": ongoing_quizzes,
            "online_users": online_users,
            "total_revenue": total_revenue,
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get realtime stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the server
if __name__ == "__main__":
    uvicorn.run(
        app, 
        host=os.getenv("HOST", "0.0.0.0"), 
        port=int(os.getenv("PORT", "8001")),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )