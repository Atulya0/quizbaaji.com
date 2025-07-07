from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from .server import db, get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

async def verify_admin(current_user: dict = Depends(get_current_user)):
    """Verify that the current user is an admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/users")
async def get_all_users(admin_user: dict = Depends(verify_admin)):
    """Get all users for admin panel"""
    try:
        users = await db.users.find({}, {
            "password": 0,  # Exclude password field
            "google_id": 0   # Exclude sensitive fields
        }).to_list(length=None)
        
        # Convert ObjectId to string
        for user in users:
            user["_id"] = str(user["_id"])
        
        return users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions")
async def get_all_questions(admin_user: dict = Depends(verify_admin)):
    """Get all questions for admin panel"""
    try:
        questions = await db.questions.find({}).to_list(length=None)
        
        # Convert ObjectId to string
        for question in questions:
            question["_id"] = str(question["_id"])
        
        return questions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/questions")
async def create_question(request: Request, admin_user: dict = Depends(verify_admin)):
    """Create a new question"""
    try:
        body = await request.json()
        
        question = {
            "_id": ObjectId(),
            "category": body["category"],
            "question_text": body["question_text"],
            "options": body["options"],
            "correct_answer": body["correct_answer"],
            "explanation": body.get("explanation", ""),
            "difficulty": body.get("difficulty", "medium"),
            "created_at": datetime.utcnow(),
            "created_by": str(admin_user["_id"])
        }
        
        await db.questions.insert_one(question)
        question["_id"] = str(question["_id"])
        
        return question
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/questions/{question_id}")
async def update_question(question_id: str, request: Request, admin_user: dict = Depends(verify_admin)):
    """Update a question"""
    try:
        body = await request.json()
        
        update_data = {
            "category": body["category"],
            "question_text": body["question_text"],
            "options": body["options"],
            "correct_answer": body["correct_answer"],
            "explanation": body.get("explanation", ""),
            "difficulty": body.get("difficulty", "medium"),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.questions.update_one(
            {"_id": ObjectId(question_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {"message": "Question updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, admin_user: dict = Depends(verify_admin)):
    """Delete a question"""
    try:
        result = await db.questions.delete_one({"_id": ObjectId(question_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {"message": "Question deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tournaments")
async def create_tournament(request: Request, admin_user: dict = Depends(verify_admin)):
    """Create a new tournament"""
    try:
        body = await request.json()
        
        tournament = {
            "_id": ObjectId(),
            "name": body["name"],
            "description": body["description"],
            "category": body["category"],
            "entry_fee": body["entry_fee"],
            "prize_pool": body["prize_pool"],
            "max_participants": body["max_participants"],
            "start_time": datetime.fromisoformat(body["start_time"]),
            "end_time": datetime.fromisoformat(body["end_time"]),
            "duration_minutes": body.get("duration_minutes", 5),
            "questions_count": body.get("questions_count", 30),
            "status": "upcoming",
            "participants": [],
            "created_at": datetime.utcnow(),
            "created_by": str(admin_user["_id"])
        }
        
        await db.tournaments.insert_one(tournament)
        tournament["_id"] = str(tournament["_id"])
        
        return tournament
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tournaments/{tournament_id}")
async def update_tournament(tournament_id: str, request: Request, admin_user: dict = Depends(verify_admin)):
    """Update a tournament"""
    try:
        body = await request.json()
        
        update_data = {
            "name": body["name"],
            "description": body["description"],
            "category": body["category"],
            "entry_fee": body["entry_fee"],
            "prize_pool": body["prize_pool"],
            "max_participants": body["max_participants"],
            "start_time": datetime.fromisoformat(body["start_time"]),
            "end_time": datetime.fromisoformat(body["end_time"]),
            "duration_minutes": body.get("duration_minutes", 5),
            "questions_count": body.get("questions_count", 30),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.tournaments.update_one(
            {"_id": ObjectId(tournament_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        return {"message": "Tournament updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/tournaments")
async def get_tournament_reports(admin_user: dict = Depends(verify_admin)):
    """Get tournament analytics and reports"""
    try:
        # Get tournament statistics
        pipeline = [
            {
                "$lookup": {
                    "from": "tournament_entries",
                    "localField": "_id",
                    "foreignField": "tournament_id",
                    "as": "entries"
                }
            },
            {
                "$addFields": {
                    "total_participants": {"$size": "$entries"},
                    "total_revenue": {"$multiply": ["$entry_fee", {"$size": "$entries"}]}
                }
            }
        ]
        
        tournaments = await db.tournaments.aggregate(pipeline).to_list(length=None)
        
        # Convert ObjectId to string
        for tournament in tournaments:
            tournament["_id"] = str(tournament["_id"])
        
        return tournaments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/users")
async def get_user_reports(admin_user: dict = Depends(verify_admin)):
    """Get user analytics and reports"""
    try:
        # Get user statistics
        pipeline = [
            {
                "$lookup": {
                    "from": "tournament_entries",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "tournaments"
                }
            },
            {
                "$addFields": {
                    "tournaments_joined": {"$size": "$tournaments"},
                    "total_spent": {"$sum": "$tournaments.entry_fee"}
                }
            },
            {
                "$project": {
                    "password": 0,
                    "google_id": 0
                }
            }
        ]
        
        users = await db.users.aggregate(pipeline).to_list(length=None)
        
        # Convert ObjectId to string
        for user in users:
            user["_id"] = str(user["_id"])
        
        return users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/kyc")
async def update_user_kyc_status(user_id: str, request: Request, admin_user: dict = Depends(verify_admin)):
    """Update user KYC verification status"""
    try:
        body = await request.json()
        status = body.get("status")  # "verified" or "rejected"
        
        if status not in ["verified", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        update_data = {
            "kyc_verified": status == "verified",
            "kyc_data.kyc_status": status,
            "kyc_data.verified_at": datetime.utcnow() if status == "verified" else None
        }
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": f"KYC status updated to {status}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/stats")
async def get_dashboard_stats(admin_user: dict = Depends(verify_admin)):
    """Get admin dashboard statistics"""
    try:
        # Get various statistics
        total_users = await db.users.count_documents({})
        total_tournaments = await db.tournaments.count_documents({})
        total_questions = await db.questions.count_documents({})
        active_tournaments = await db.tournaments.count_documents({"status": "active"})
        
        # Get revenue statistics
        revenue_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": {"$multiply": ["$entry_fee", {"$size": "$participants"}]}}
                }
            }
        ]
        
        revenue_result = await db.tournaments.aggregate(revenue_pipeline).to_list(length=1)
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
        
        return {
            "total_users": total_users,
            "total_tournaments": total_tournaments,
            "total_questions": total_questions,
            "active_tournaments": active_tournaments,
            "total_revenue": total_revenue
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))