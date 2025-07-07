from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
import random
from datetime import datetime, timedelta
from bson import ObjectId
import asyncio
import logging
from database import db
from server import get_current_user
from websocket_manager import websocket_manager

router = APIRouter(prefix="/api/quiz", tags=["quiz"])
logger = logging.getLogger(__name__)

@router.post("/{tournament_id}/start")
async def start_quiz(tournament_id: str, current_user: dict = Depends(get_current_user)):
    """Start a quiz session for a tournament with real-time features"""
    try:
        # Check if tournament exists
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if tournament is active
        now = datetime.utcnow()
        if now < tournament["start_time"]:
            raise HTTPException(status_code=400, detail="Tournament not started yet")
        
        if now > tournament["end_time"]:
            raise HTTPException(status_code=400, detail="Tournament has ended")
        
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
            if existing_session["status"] == "completed":
                raise HTTPException(status_code=400, detail="Quiz already completed")
            else:
                # Return existing session
                return {
                    "session_id": str(existing_session["_id"]),
                    "message": "Quiz already started",
                    "current_question": existing_session.get("current_question", 0),
                    "time_remaining": existing_session.get("time_remaining", 300)
                }
        
        # Get random questions for the tournament category
        questions = await db.questions.find({
            "category": tournament["category"]
        }).to_list(length=None)
        
        if len(questions) < tournament["questions_count"]:
            raise HTTPException(status_code=400, detail="Not enough questions for this tournament")
        
        # Randomize questions for each user (anti-cheat measure)
        random.shuffle(questions)
        selected_questions = questions[:tournament["questions_count"]]
        
        # Randomize answer options for each question (additional anti-cheat)
        quiz_questions = []
        for q in selected_questions:
            # Create a randomized version of options
            correct_answer = q["correct_answer"]
            options = q["options"].copy()
            
            # Shuffle options and update correct answer index
            original_options = options.copy()
            random.shuffle(options)
            new_correct_index = options.index(original_options[correct_answer])
            
            quiz_questions.append({
                "id": str(q["_id"]),
                "question_text": q["question_text"],
                "options": options,
                "correct_answer": new_correct_index,
                "explanation": q.get("explanation", ""),
                "difficulty": q.get("difficulty", "medium")
            })
        
        # Create quiz session
        session = {
            "_id": ObjectId(),
            "user_id": current_user["_id"],
            "tournament_id": ObjectId(tournament_id),
            "questions": quiz_questions,
            "answers": [],
            "current_question": 0,
            "score": 0,
            "start_time": datetime.utcnow(),
            "end_time": None,
            "status": "started",
            "time_remaining": tournament["duration_minutes"] * 60,
            "question_start_time": datetime.utcnow(),
            "security_violations": []
        }
        
        await db.quiz_sessions.insert_one(session)
        
        # Update tournament entry with session ID
        await db.tournament_entries.update_one(
            {"_id": entry["_id"]},
            {"$set": {"quiz_session_id": str(session["_id"])}}
        )
        
        # Start real-time quiz session via WebSocket
        quiz_data = {
            "session_id": str(session["_id"]),
            "questions": [
                {
                    "question_text": q["question_text"],
                    "options": q["options"]
                } for q in quiz_questions
            ],
            "total_time": tournament["duration_minutes"] * 60,
            "questions_count": tournament["questions_count"],
            "current_question": 0
        }
        
        # Initialize WebSocket session
        await websocket_manager.start_quiz_session(
            str(current_user["_id"]), 
            str(session["_id"]), 
            quiz_data
        )
        
        # Return only the first question
        return {
            "session_id": str(session["_id"]),
            "current_question": {
                "index": 0,
                "question_text": quiz_questions[0]["question_text"],
                "options": quiz_questions[0]["options"]
            },
            "total_questions": tournament["questions_count"],
            "total_time": tournament["duration_minutes"] * 60,
            "question_time": 5  # 5 seconds per question
        }
        
    except Exception as e:
        logger.error(f"Error starting quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/answer")
async def submit_answer(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Submit an answer for a question with real-time feedback"""
    try:
        body = await request.json()
        question_index = body.get("question_index")
        answer = body.get("answer")
        time_taken = body.get("time_taken", 5)  # Time taken for this question
        
        session = await db.quiz_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        if session["status"] != "started":
            raise HTTPException(status_code=400, detail="Quiz session is not active")
        
        if question_index >= len(session["questions"]):
            raise HTTPException(status_code=400, detail="Invalid question index")
        
        # Check if question was already answered
        answers = session.get("answers", [])
        while len(answers) <= question_index:
            answers.append(None)
        
        if answers[question_index] is not None:
            raise HTTPException(status_code=400, detail="Question already answered")
        
        # Record the answer
        answers[question_index] = {
            "answer": answer,
            "time_taken": time_taken,
            "submitted_at": datetime.utcnow()
        }
        
        # Calculate score
        question = session["questions"][question_index]
        is_correct = answer == question["correct_answer"]
        score = session["score"]
        if is_correct:
            score += 1
        
        # Update session
        await db.quiz_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "answers": answers,
                    "score": score,
                    "current_question": question_index + 1,
                    "question_start_time": datetime.utcnow()
                }
            }
        )
        
        # Prepare response data
        response_data = {
            "is_correct": is_correct,
            "correct_answer": question["correct_answer"],
            "explanation": question.get("explanation", ""),
            "current_score": score,
            "question_index": question_index
        }
        
        # Send real-time update via WebSocket
        await websocket_manager.submit_quiz_answer(
            str(current_user["_id"]), 
            session_id, 
            response_data
        )
        
        # Check if quiz is completed
        if question_index >= len(session["questions"]) - 1:
            await complete_quiz_internal(session_id, current_user)
        else:
            # Send next question
            next_question = session["questions"][question_index + 1]
            response_data["next_question"] = {
                "index": question_index + 1,
                "question_text": next_question["question_text"],
                "options": next_question["options"]
            }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/complete")
async def complete_quiz(session_id: str, current_user: dict = Depends(get_current_user)):
    """Complete a quiz session manually"""
    return await complete_quiz_internal(session_id, current_user)

async def complete_quiz_internal(session_id: str, current_user: dict):
    """Internal function to complete quiz session"""
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
        
        # Calculate results
        results = {
            "session_id": session_id,
            "final_score": session["score"],
            "total_questions": len(session["questions"]),
            "percentage": (session["score"] / len(session["questions"])) * 100,
            "time_taken": time_taken
        }
        
        # Send real-time completion update
        await websocket_manager.end_quiz_session(session_id, str(current_user["_id"]), results)
        
        # Calculate rankings and prizes after a delay to allow other participants to finish
        asyncio.create_task(calculate_tournament_results_delayed(str(session["tournament_id"])))
        
        return {"message": "Quiz completed successfully", "results": results}
        
    except Exception as e:
        logger.error(f"Error completing quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/results")
async def get_quiz_results(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed quiz results"""
    try:
        session = await db.quiz_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user["_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        
        tournament = await db.tournaments.find_one({"_id": session["tournament_id"]})
        entry = await db.tournament_entries.find_one({"quiz_session_id": session_id})
        
        # Calculate detailed statistics
        correct_answers = 0
        total_time_taken = 0
        question_stats = []
        
        for i, answer_data in enumerate(session.get("answers", [])):
            if answer_data:
                question = session["questions"][i]
                is_correct = answer_data["answer"] == question["correct_answer"]
                if is_correct:
                    correct_answers += 1
                
                total_time_taken += answer_data.get("time_taken", 5)
                
                question_stats.append({
                    "question_index": i,
                    "question_text": question["question_text"],
                    "user_answer": answer_data["answer"],
                    "correct_answer": question["correct_answer"],
                    "is_correct": is_correct,
                    "time_taken": answer_data.get("time_taken", 5),
                    "explanation": question.get("explanation", "")
                })
        
        return {
            "session_id": session_id,
            "score": correct_answers,
            "total_questions": len(session["questions"]),
            "percentage": (correct_answers / len(session["questions"])) * 100 if session["questions"] else 0,
            "rank": entry.get("rank") if entry else None,
            "prize_amount": entry.get("prize_amount", 0) if entry else 0,
            "tournament_name": tournament["name"] if tournament else "Unknown",
            "time_taken": session.get("time_taken", 0),
            "total_time_taken_questions": total_time_taken,
            "status": session["status"],
            "question_stats": question_stats,
            "security_violations": session.get("security_violations", [])
        }
        
    except Exception as e:
        logger.error(f"Error getting quiz results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/report-violation")
async def report_security_violation(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Report a security violation during quiz"""
    try:
        body = await request.json()
        violation_type = body.get("type")  # 'tab_switch', 'copy_attempt', 'paste_attempt', 'devtools'
        timestamp = body.get("timestamp", datetime.utcnow().isoformat())
        
        # Record the violation
        violation = {
            "type": violation_type,
            "timestamp": datetime.utcnow(),
            "user_reported_time": timestamp
        }
        
        await db.quiz_sessions.update_one(
            {"_id": ObjectId(session_id), "user_id": current_user["_id"]},
            {"$push": {"security_violations": violation}}
        )
        
        # Send real-time alert to admins
        await websocket_manager.broadcast_to_admins({
            "type": "security_violation",
            "session_id": session_id,
            "user_id": str(current_user["_id"]),
            "user_email": current_user.get("email"),
            "violation_type": violation_type,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.warning(f"Security violation reported: {violation_type} by user {current_user['_id']} in session {session_id}")
        
        return {"message": "Violation reported"}
        
    except Exception as e:
        logger.error(f"Error reporting violation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def calculate_tournament_results_delayed(tournament_id: str):
    """Calculate tournament results after a delay"""
    await asyncio.sleep(30)  # Wait 30 seconds for other participants to finish
    await calculate_tournament_results(tournament_id)

async def calculate_tournament_results(tournament_id: str):
    """Calculate tournament rankings and distribute prizes with real-time updates"""
    try:
        # Get all completed entries for the tournament
        entries = await db.tournament_entries.find({
            "tournament_id": ObjectId(tournament_id),
            "final_score": {"$exists": True}
        }).sort("final_score", -1).to_list(length=None)
        
        if not entries:
            return
        
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            return
        
        # Calculate prize distribution (60% of total collected fees)
        total_collected = len(entries) * tournament["entry_fee"]
        profit = total_collected * 0.6
        
        # Prize distribution: 50%, 30%, 20% of the profit
        prizes = [
            profit * 0.5,  # 1st place
            profit * 0.3,  # 2nd place
            profit * 0.2   # 3rd place
        ]
        
        # Update rankings and distribute prizes
        for i, entry in enumerate(entries):
            rank = i + 1
            prize_amount = prizes[i] if i < 3 else 0
            
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
                
                # Create wallet transaction record
                wallet_transaction = {
                    "_id": ObjectId(),
                    "user_id": entry["user_id"],
                    "type": "credit",
                    "amount": prize_amount,
                    "description": f"Prize for {tournament['name']} - Rank {rank}",
                    "tournament_id": ObjectId(tournament_id),
                    "created_at": datetime.utcnow()
                }
                await db.wallet_transactions.insert_one(wallet_transaction)
                
                # Send real-time wallet update
                await websocket_manager.send_wallet_update(
                    str(entry["user_id"]), 
                    (await db.users.find_one({"_id": entry["user_id"]}))["wallet_balance"],
                    {
                        "type": "credit",
                        "amount": prize_amount,
                        "description": f"Prize for {tournament['name']} - Rank {rank}"
                    }
                )
        
        # Update tournament status
        await db.tournaments.update_one(
            {"_id": ObjectId(tournament_id)},
            {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
        )
        
        # Send tournament completion update to all participants
        await websocket_manager.send_tournament_update(tournament_id, {
            "status": "completed",
            "total_participants": len(entries),
            "total_prize_distributed": sum(prizes[:min(3, len(entries))]),
            "leaderboard": [
                {
                    "rank": i + 1,
                    "score": entry["final_score"],
                    "prize": prizes[i] if i < 3 else 0
                } for i, entry in enumerate(entries[:10])  # Top 10
            ]
        })
        
        logger.info(f"Tournament {tournament_id} results calculated. {len(entries)} participants, {sum(prizes[:min(3, len(entries))])} total prizes distributed.")
        
    except Exception as e:
        logger.error(f"Error calculating tournament results: {e}")

@router.get("/leaderboard/{tournament_id}")
async def get_tournament_leaderboard(tournament_id: str):
    """Get real-time tournament leaderboard"""
    try:
        # Get top 10 entries with user information
        pipeline = [
            {"$match": {"tournament_id": ObjectId(tournament_id), "final_score": {"$exists": True}}},
            {"$sort": {"final_score": -1, "joined_at": 1}},
            {"$limit": 10},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$project": {
                "rank": {"$add": [{"$indexOfArray": [[], 0]}, 1]},
                "score": "$final_score",
                "user_name": "$user.name",
                "user_avatar": "$user.avatar",
                "prize_amount": {"$ifNull": ["$prize_amount", 0]},
                "completed_at": "$joined_at"
            }}
        ]
        
        leaderboard = await db.tournament_entries.aggregate(pipeline).to_list(length=10)
        
        # Add rank manually since MongoDB aggregation didn't work as expected
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))