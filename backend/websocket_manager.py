import json
import asyncio
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
from bson import ObjectId

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        # Store active connections by user_id
        self.user_connections: Dict[str, WebSocket] = {}
        # Store connections by tournament_id for quiz sessions
        self.tournament_connections: Dict[str, Set[WebSocket]] = {}
        # Store admin connections
        self.admin_connections: Set[WebSocket] = set()
        # Store quiz session connections
        self.quiz_sessions: Dict[str, Dict] = {}
        
    async def connect_user(self, websocket: WebSocket, user_id: str, user_role: str = "user"):
        """Connect a user and store their connection"""
        await websocket.accept()
        
        # Disconnect existing connection if any
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].close()
            except:
                pass
        
        self.user_connections[user_id] = websocket
        
        if user_role == "admin":
            self.admin_connections.add(websocket)
            
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Send connection confirmation
        await self.send_to_user(user_id, {
            "type": "connection_status",
            "status": "connected",
            "timestamp": datetime.utcnow().isoformat()
        })

    async def disconnect_user(self, user_id: str):
        """Disconnect a user and clean up their connections"""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            
            # Remove from admin connections if applicable
            if websocket in self.admin_connections:
                self.admin_connections.discard(websocket)
            
            # Remove from tournament connections
            for tournament_id, connections in self.tournament_connections.items():
                connections.discard(websocket)
            
            # Remove user connection
            del self.user_connections[user_id]
            
            logger.info(f"User {user_id} disconnected from WebSocket")

    async def join_tournament_room(self, user_id: str, tournament_id: str):
        """Join a user to a tournament room for real-time updates"""
        if user_id not in self.user_connections:
            return False
            
        websocket = self.user_connections[user_id]
        
        if tournament_id not in self.tournament_connections:
            self.tournament_connections[tournament_id] = set()
            
        self.tournament_connections[tournament_id].add(websocket)
        
        # Send confirmation
        await self.send_to_user(user_id, {
            "type": "tournament_joined",
            "tournament_id": tournament_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return True

    async def leave_tournament_room(self, user_id: str, tournament_id: str):
        """Remove user from tournament room"""
        if user_id not in self.user_connections:
            return
            
        websocket = self.user_connections[user_id]
        
        if tournament_id in self.tournament_connections:
            self.tournament_connections[tournament_id].discard(websocket)
            
            # Clean up empty tournament rooms
            if not self.tournament_connections[tournament_id]:
                del self.tournament_connections[tournament_id]

    async def start_quiz_session(self, user_id: str, session_id: str, quiz_data: dict):
        """Start a real-time quiz session"""
        if user_id not in self.user_connections:
            return False
            
        self.quiz_sessions[session_id] = {
            "user_id": user_id,
            "start_time": datetime.utcnow(),
            "current_question": 0,
            "total_questions": len(quiz_data.get("questions", [])),
            "time_remaining": quiz_data.get("total_time", 300),  # 5 minutes default
            "status": "active"
        }
        
        # Send quiz start event
        await self.send_to_user(user_id, {
            "type": "quiz_started",
            "session_id": session_id,
            "quiz_data": quiz_data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Start quiz timer
        asyncio.create_task(self.quiz_timer(session_id, user_id))
        
        return True

    async def quiz_timer(self, session_id: str, user_id: str):
        """Handle quiz timing and auto-submission"""
        if session_id not in self.quiz_sessions:
            return
            
        session = self.quiz_sessions[session_id]
        
        while session["time_remaining"] > 0 and session["status"] == "active":
            await asyncio.sleep(1)
            session["time_remaining"] -= 1
            
            # Send time update every 5 seconds
            if session["time_remaining"] % 5 == 0:
                await self.send_to_user(user_id, {
                    "type": "time_update",
                    "session_id": session_id,
                    "time_remaining": session["time_remaining"],
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Time's up - end quiz
        if session["status"] == "active":
            session["status"] = "completed"
            await self.send_to_user(user_id, {
                "type": "quiz_ended",
                "session_id": session_id,
                "reason": "time_up",
                "timestamp": datetime.utcnow().isoformat()
            })

    async def submit_quiz_answer(self, user_id: str, session_id: str, answer_data: dict):
        """Handle real-time quiz answer submission"""
        if session_id not in self.quiz_sessions:
            return False
            
        session = self.quiz_sessions[session_id]
        if session["status"] != "active":
            return False
        
        # Update current question
        session["current_question"] = answer_data.get("question_index", 0) + 1
        
        # Send answer confirmation
        await self.send_to_user(user_id, {
            "type": "answer_submitted",
            "session_id": session_id,
            "question_index": answer_data.get("question_index"),
            "is_correct": answer_data.get("is_correct", False),
            "correct_answer": answer_data.get("correct_answer"),
            "explanation": answer_data.get("explanation", ""),
            "current_score": answer_data.get("current_score", 0),
            "next_question": session["current_question"],
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return True

    async def end_quiz_session(self, session_id: str, user_id: str, results: dict):
        """End a quiz session and send results"""
        if session_id in self.quiz_sessions:
            self.quiz_sessions[session_id]["status"] = "completed"
            
        await self.send_to_user(user_id, {
            "type": "quiz_completed",
            "session_id": session_id,
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Clean up session after 5 minutes
        asyncio.create_task(self.cleanup_session(session_id))

    async def cleanup_session(self, session_id: str):
        """Clean up quiz session after delay"""
        await asyncio.sleep(300)  # 5 minutes
        if session_id in self.quiz_sessions:
            del self.quiz_sessions[session_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id not in self.user_connections:
            return False
            
        try:
            await self.user_connections[user_id].send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending message to user {user_id}: {e}")
            # Clean up broken connection
            await self.disconnect_user(user_id)
            return False

    async def broadcast_to_tournament(self, tournament_id: str, message: dict):
        """Broadcast message to all users in a tournament"""
        if tournament_id not in self.tournament_connections:
            return 0
            
        sent_count = 0
        broken_connections = []
        
        for websocket in self.tournament_connections[tournament_id].copy():
            try:
                await websocket.send_text(json.dumps(message))
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to tournament {tournament_id}: {e}")
                broken_connections.append(websocket)
        
        # Clean up broken connections
        for websocket in broken_connections:
            self.tournament_connections[tournament_id].discard(websocket)
            
        return sent_count

    async def broadcast_to_admins(self, message: dict):
        """Broadcast message to all admin users"""
        sent_count = 0
        broken_connections = []
        
        for websocket in self.admin_connections.copy():
            try:
                await websocket.send_text(json.dumps(message))
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to admin: {e}")
                broken_connections.append(websocket)
        
        # Clean up broken connections
        for websocket in broken_connections:
            self.admin_connections.discard(websocket)
            
        return sent_count

    async def send_wallet_update(self, user_id: str, new_balance: float, transaction: dict):
        """Send real-time wallet balance update"""
        await self.send_to_user(user_id, {
            "type": "wallet_update",
            "new_balance": new_balance,
            "transaction": transaction,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def send_tournament_update(self, tournament_id: str, update_data: dict):
        """Send tournament status updates to participants"""
        message = {
            "type": "tournament_update",
            "tournament_id": tournament_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.broadcast_to_tournament(tournament_id, message)

    def get_active_users_count(self) -> int:
        """Get count of active users"""
        return len(self.user_connections)

    def get_tournament_participants_count(self, tournament_id: str) -> int:
        """Get count of participants in a tournament"""
        return len(self.tournament_connections.get(tournament_id, set()))

    def get_active_quiz_sessions_count(self) -> int:
        """Get count of active quiz sessions"""
        return len([s for s in self.quiz_sessions.values() if s["status"] == "active"])

# Global WebSocket manager instance
websocket_manager = WebSocketManager()