import os
import motor.motor_asyncio
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

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