from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class KYCStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class TournamentStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class QuizSessionStatus(str, Enum):
    STARTED = "started"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class User(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    google_id: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole = UserRole.USER
    is_verified: bool = False
    wallet_balance: float = 0.0
    kyc_verified: bool = False
    kyc_data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Tournament(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    entry_fee: float
    prize_pool: float
    max_participants: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 5
    questions_count: int = 30
    status: TournamentStatus = TournamentStatus.UPCOMING
    participants: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class Question(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    question_text: str
    options: List[str]
    correct_answer: int  # Index of correct answer
    explanation: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class QuizSession(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tournament_id: str
    questions: List[Dict[str, Any]]
    answers: List[Optional[int]] = []
    score: int = 0
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    status: QuizSessionStatus = QuizSessionStatus.STARTED
    time_taken: Optional[float] = None

class Payment(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tournament_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    payment_intent_id: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TournamentEntry(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    user_id: str
    payment_id: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    quiz_session_id: Optional[str] = None
    final_score: Optional[int] = None
    rank: Optional[int] = None
    prize_amount: Optional[float] = None

class GoogleAuthRequest(BaseModel):
    token: str
    email: str
    name: str
    google_id: str
    avatar: Optional[str] = None

class KYCRequest(BaseModel):
    full_name: str
    phone: str
    address: str
    document_type: str
    document_number: str
    document_front: str  # Base64 encoded image
    document_back: str   # Base64 encoded image