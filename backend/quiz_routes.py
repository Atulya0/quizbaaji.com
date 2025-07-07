from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
import random
from datetime import datetime, timedelta
from bson import ObjectId
import asyncio
from .server import db, get_current_user

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

@router.post("/{tournament_id}/start")
async def start_quiz(tournament_id: str, current_user: dict = Depends(get_current_user)):
    """Start a quiz session for a tournament"""
    try:
        # Check if tournament exists
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if user has joined the tournament
        entry = await db.tournament_entries.find_one({
            "tournament_id": ObjectId(tournament_id),
            "user_id": current_user["_id"]
        })
        if not entry:
            raise HTTPException(status_code=400, detail="You haven't joined this tournament")
        
        # Check if quiz already started
        existing_session = await db.quiz_sessions.find_one({
            "tournament_id": ObjectId(tournament_id),
            "user_id": current_user["_id"],
            "status": {"$in": ["started", "completed"]}
        })
        if existing_session:
            return {"session_id": str(existing_session["_id"]), "message": "Quiz already started"}
        
        # Get random questions for the tournament category
        questions = await db.questions.find({
            "category": tournament["category"]
        }).to_list(length=None)
        
        if len(questions) < tournament["questions_count"]:
            raise HTTPException(status_code=400, detail="Not enough questions for this tournament")
        
        # Randomize questions
        selected_questions = random.sample(questions, tournament["questions_count"])
        
        # Create quiz session
        session = {
            "_id": ObjectId(),
            "user_id": current_user["_id"],
            "tournament_id": ObjectId(tournament_id),
            "questions": [
                {
                    "id": str(q["_id"]),
                    "question_text": q["question_text"],
                    "options": q["options"],
                    "correct_answer": q["correct_answer"],
                    "explanation": q.get("explanation", "")
                } for q in selected_questions
            ],
            "answers": [],
            "current_question": 0,
            "score": 0,
            "start_time": datetime.utcnow(),
            "end_time": None,
            "status": "started",
            "time_remaining": tournament["duration_minutes"] * 60
        }
        
        await db.quiz_sessions.insert_one(session)
        
        # Update tournament entry with session ID
        await db.tournament_entries.update_one(
            {"_id": entry["_id"]},
            {"$set": {"quiz_session_id": str(session["_id"])}}
        )
        
        return {
            "session_id": str(session["_id"]),
            "questions": session["questions"],
            "total_time": tournament["duration_minutes"] * 60,
            "questions_count": tournament["questions_count"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/answer")
async def submit_answer(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Submit an answer for a question"""
    try:
        body = await request.json()
        question_index = body.get("question_index")
        answer = body.get("answer")
        
        session = await db.quiz_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        if session["status"] != "started":
            raise HTTPException(status_code=400, detail="Quiz session is not active")
        
        # Update answers array
        answers = session.get("answers", [])
        while len(answers) <= question_index:
            answers.append(None)
        answers[question_index] = answer
        
        # Calculate score
        score = 0
        for i, ans in enumerate(answers):
            if ans is not None and i < len(session["questions"]):
                if ans == session["questions"][i]["correct_answer"]:
                    score += 1
        
        # Update session
        await db.quiz_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "answers": answers,
                    "score": score,
                    "current_question": question_index + 1
                }
            }
        )
        
        # Check if quiz is completed
        if question_index >= len(session["questions"]) - 1:
            await complete_quiz(session_id, current_user)
        
        return {
            "correct": answer == session["questions"][question_index]["correct_answer"],
            "correct_answer": session["questions"][question_index]["correct_answer"],
            "explanation": session["questions"][question_index].get("explanation", ""),
            "current_score": score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/complete")
async def complete_quiz(session_id: str, current_user: dict = Depends(get_current_user)):
    """Complete a quiz session"""
    try:
        session = await db.quiz_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        if session["status"] == "completed":
            return {"message": "Quiz already completed"}
        
        # Mark session as completed
        end_time = datetime.utcnow()
        time_taken = (end_time - session["start_time"]).total_seconds()
        
        await db.quiz_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "completed",
                    "end_time": end_time,
                    "time_taken": time_taken
                }
            }
        )
        
        # Update tournament entry with final score
        await db.tournament_entries.update_one(
            {"quiz_session_id": session_id},
            {"$set": {"final_score": session["score"]}}
        )
        
        # Calculate rankings and prizes
        await calculate_tournament_results(str(session["tournament_id"]))
        
        return {"message": "Quiz completed successfully", "final_score": session["score"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/results")
async def get_quiz_results(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get quiz results"""
    try:
        session = await db.quiz_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        tournament = await db.tournaments.find_one({"_id": session["tournament_id"]})
        entry = await db.tournament_entries.find_one({"quiz_session_id": session_id})
        
        return {
            "session_id": session_id,
            "score": session["score"],
            "total_questions": len(session["questions"]),
            "percentage": (session["score"] / len(session["questions"])) * 100,
            "rank": entry.get("rank"),
            "prize_amount": entry.get("prize_amount", 0),
            "tournament_name": tournament["name"],
            "time_taken": session.get("time_taken", 0),
            "status": session["status"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def calculate_tournament_results(tournament_id: str):
    """Calculate tournament rankings and distribute prizes"""
    try:
        # Get all completed entries for the tournament
        entries = await db.tournament_entries.find({
            "tournament_id": ObjectId(tournament_id),
            "final_score": {"$exists": True}
        }).sort("final_score", -1).to_list(length=None)
        
        if not entries:
            return
        
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        total_prize_pool = tournament["prize_pool"]
        
        # Calculate prize distribution (60% of profit split in 3 categories)
        profit = total_prize_pool * 0.6
        first_prize = profit * 0.5  # 50% of 60%
        second_prize = profit * 0.3  # 30% of 60%
        third_prize = profit * 0.2   # 20% of 60%
        
        # Update rankings and prizes
        for i, entry in enumerate(entries):
            rank = i + 1
            prize_amount = 0
            
            if rank == 1:
                prize_amount = first_prize
            elif rank == 2:
                prize_amount = second_prize
            elif rank == 3:
                prize_amount = third_prize
            
            # Update entry with rank and prize
            await db.tournament_entries.update_one(
                {"_id": entry["_id"]},
                {"$set": {"rank": rank, "prize_amount": prize_amount}}
            )
            
            # Update user wallet if they won a prize
            if prize_amount > 0:
                await db.users.update_one(
                    {"_id": entry["user_id"]},
                    {"$inc": {"wallet_balance": prize_amount}}
                )
        
    except Exception as e:
        print(f"Error calculating tournament results: {e}")