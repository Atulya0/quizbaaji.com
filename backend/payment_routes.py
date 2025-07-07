from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
import stripe
from datetime import datetime, timedelta
from bson import ObjectId
import logging
from .server import db, get_current_user, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Configure Stripe
stripe.api_key = STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

@router.post("/create-payment-intent")
async def create_payment_intent(request: Request, current_user: dict = Depends(get_current_user)):
    """Create a Stripe payment intent for tournament entry"""
    try:
        body = await request.json()
        tournament_id = body.get("tournament_id")
        amount = body.get("amount", 39)  # Default ₹39
        
        if not tournament_id:
            raise HTTPException(status_code=400, detail="Tournament ID required")
        
        # Verify tournament exists
        tournament = await db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if user already joined
        existing_entry = await db.tournament_entries.find_one({
            "tournament_id": ObjectId(tournament_id),
            "user_id": current_user["_id"]
        })
        
        if existing_entry:
            raise HTTPException(status_code=400, detail="Already joined this tournament")
        
        # Create payment intent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to paise (smallest currency unit)
            currency='inr',
            metadata={
                'tournament_id': tournament_id,
                'user_id': str(current_user["_id"]),
                'user_email': current_user["email"]
            },
            receipt_email=current_user["email"]
        )
        
        # Store payment intent in database
        payment_record = {
            "_id": ObjectId(),
            "payment_intent_id": intent.id,
            "user_id": current_user["_id"],
            "tournament_id": ObjectId(tournament_id),
            "amount": amount,
            "currency": "inr",
            "status": "pending",
            "created_at": datetime.utcnow(),
            "metadata": {
                "tournament_name": tournament["name"],
                "user_email": current_user["email"]
            }
        }
        
        await db.payments.insert_one(payment_record)
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Payment intent creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm-payment")
async def confirm_payment(request: Request, current_user: dict = Depends(get_current_user)):
    """Confirm payment and join tournament"""
    try:
        body = await request.json()
        payment_intent_id = body.get("payment_intent_id")
        
        if not payment_intent_id:
            raise HTTPException(status_code=400, detail="Payment intent ID required")
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not successful")
        
        # Update payment record
        payment_record = await db.payments.find_one({"payment_intent_id": payment_intent_id})
        if not payment_record:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        await db.payments.update_one(
            {"payment_intent_id": payment_intent_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "stripe_charge_id": intent.latest_charge
                }
            }
        )
        
        # Join tournament
        tournament_id = payment_record["tournament_id"]
        
        # Create tournament entry
        entry = {
            "_id": ObjectId(),
            "tournament_id": tournament_id,
            "user_id": current_user["_id"],
            "payment_id": payment_record["_id"],
            "entry_fee": payment_record["amount"],
            "joined_at": datetime.utcnow(),
            "quiz_session_id": None,
            "final_score": None,
            "rank": None,
            "prize_amount": None
        }
        
        await db.tournament_entries.insert_one(entry)
        
        # Add participant to tournament
        await db.tournaments.update_one(
            {"_id": tournament_id},
            {"$push": {"participants": str(current_user["_id"])}}
        )
        
        # Update user's wallet (add any bonus if applicable)
        # Could add first-time user bonus here
        
        return {
            "message": "Payment successful and tournament joined",
            "entry_id": str(entry["_id"]),
            "tournament_id": str(tournament_id)
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe confirm error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment confirmation error: {str(e)}")
    except Exception as e:
        logger.error(f"Payment confirmation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for payment events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle different event types
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            logger.info(f"Payment succeeded: {payment_intent['id']}")
            
            # Update payment status
            await db.payments.update_one(
                {"payment_intent_id": payment_intent['id']},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "webhook_received": True
                    }
                }
            )
            
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            logger.warning(f"Payment failed: {payment_intent['id']}")
            
            # Update payment status
            await db.payments.update_one(
                {"payment_intent_id": payment_intent['id']},
                {
                    "$set": {
                        "status": "failed",
                        "failed_at": datetime.utcnow(),
                        "failure_reason": payment_intent.get('last_payment_error', {}).get('message', 'Unknown'),
                        "webhook_received": True
                    }
                }
            )
            
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-payments")
async def get_user_payments(current_user: dict = Depends(get_current_user)):
    """Get payment history for current user"""
    try:
        payments = await db.payments.find(
            {"user_id": current_user["_id"]},
            {"_id": 0, "payment_intent_id": 0}  # Exclude sensitive fields
        ).sort("created_at", -1).to_list(length=50)
        
        # Convert ObjectId to string for tournament_id
        for payment in payments:
            if "tournament_id" in payment:
                payment["tournament_id"] = str(payment["tournament_id"])
        
        return payments
        
    except Exception as e:
        logger.error(f"Get user payments error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-funds")
async def add_funds_to_wallet(request: Request, current_user: dict = Depends(get_current_user)):
    """Add funds to user wallet"""
    try:
        body = await request.json()
        amount = body.get("amount")
        
        if not amount or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        if amount > 50000:  # Max ₹50,000 per transaction
            raise HTTPException(status_code=400, detail="Amount exceeds maximum limit")
        
        # Create payment intent for wallet top-up
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to paise
            currency='inr',
            metadata={
                'type': 'wallet_topup',
                'user_id': str(current_user["_id"]),
                'user_email': current_user["email"]
            },
            receipt_email=current_user["email"]
        )
        
        # Store payment record
        payment_record = {
            "_id": ObjectId(),
            "payment_intent_id": intent.id,
            "user_id": current_user["_id"],
            "amount": amount,
            "currency": "inr",
            "type": "wallet_topup",
            "status": "pending",
            "created_at": datetime.utcnow(),
            "metadata": {
                "user_email": current_user["email"]
            }
        }
        
        await db.payments.insert_one(payment_record)
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error in add funds: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Add funds error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm-wallet-topup")
async def confirm_wallet_topup(request: Request, current_user: dict = Depends(get_current_user)):
    """Confirm wallet top-up payment"""
    try:
        body = await request.json()
        payment_intent_id = body.get("payment_intent_id")
        
        if not payment_intent_id:
            raise HTTPException(status_code=400, detail="Payment intent ID required")
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not successful")
        
        # Update payment record
        payment_record = await db.payments.find_one({"payment_intent_id": payment_intent_id})
        if not payment_record:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        await db.payments.update_one(
            {"payment_intent_id": payment_intent_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        # Add amount to user wallet
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$inc": {"wallet_balance": payment_record["amount"]}}
        )
        
        # Create wallet transaction record
        wallet_transaction = {
            "_id": ObjectId(),
            "user_id": current_user["_id"],
            "type": "credit",
            "amount": payment_record["amount"],
            "description": "Wallet top-up",
            "payment_id": payment_record["_id"],
            "created_at": datetime.utcnow()
        }
        
        await db.wallet_transactions.insert_one(wallet_transaction)
        
        # Get updated user balance
        updated_user = await db.users.find_one({"_id": current_user["_id"]})
        
        return {
            "message": "Wallet topped up successfully",
            "amount_added": payment_record["amount"],
            "new_balance": updated_user["wallet_balance"]
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe confirm wallet error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment confirmation error: {str(e)}")
    except Exception as e:
        logger.error(f"Wallet topup confirmation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wallet-transactions")
async def get_wallet_transactions(current_user: dict = Depends(get_current_user)):
    """Get wallet transaction history"""
    try:
        transactions = await db.wallet_transactions.find(
            {"user_id": current_user["_id"]}
        ).sort("created_at", -1).to_list(length=100)
        
        # Convert ObjectId to string
        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
            if "payment_id" in transaction:
                transaction["payment_id"] = str(transaction["payment_id"])
        
        return transactions
        
    except Exception as e:
        logger.error(f"Get wallet transactions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))