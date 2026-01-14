from fastapi import APIRouter, Depends, HTTPException, status, Form
from app.api.deps import get_current_active_user
from app.db.mongodb import get_database
from app.core.security import get_password_hash, verify_password
from app.models.status import StatusCode
from datetime import datetime

router = APIRouter()


@router.post("/set-mpin")
async def set_mpin(
    mpin: str = Form(...),
    confirm_mpin: str = Form(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Set MPIN for user and change status to Pending for Approval"""
    db = get_database()
    
    # Validate MPIN
    if not mpin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN must contain only digits"
        )
    
    if len(mpin) != 4 and len(mpin) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN must be 4 or 6 digits"
        )
    
    if mpin != confirm_mpin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN and Confirm MPIN do not match"
        )
    
    # Check if user already has MPIN
    if current_user.get("has_mpin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN already set. Use change-mpin to update."
        )
    
    # Check if status exists
    pending_status = await db.user_statuses.find_one({"code": StatusCode.PENDING_APPROVAL})
    if not pending_status:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Status configuration error. Please contact administrator."
        )
    
    # Hash MPIN
    hashed_mpin = get_password_hash(mpin)
    
    # Update user
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "mpin_hash": hashed_mpin,
                "has_mpin": True,
                "status": StatusCode.PENDING_APPROVAL,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "MPIN set successfully. Your account is now pending for admin approval.",
        "status": StatusCode.PENDING_APPROVAL
    }


@router.post("/change-mpin")
async def change_mpin(
    old_mpin: str = Form(...),
    new_mpin: str = Form(...),
    confirm_mpin: str = Form(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Change existing MPIN"""
    db = get_database()
    
    # Check if user has MPIN
    if not current_user.get("has_mpin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN not set. Use set-mpin first."
        )
    
    # Verify old MPIN
    if not verify_password(old_mpin, current_user.get("mpin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old MPIN"
        )
    
    # Validate new MPIN
    if not new_mpin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN must contain only digits"
        )
    
    if len(new_mpin) != 4 and len(new_mpin) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN must be 4 or 6 digits"
        )
    
    if new_mpin != confirm_mpin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New MPIN and Confirm MPIN do not match"
        )
    
    # Hash new MPIN
    hashed_mpin = get_password_hash(new_mpin)
    
    # Update user
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "mpin_hash": hashed_mpin,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "MPIN changed successfully"}


@router.post("/verify-mpin")
async def verify_mpin(
    mpin: str = Form(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Verify MPIN (for transactions, etc.)"""
    if not current_user.get("has_mpin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN not set"
        )
    
    if not verify_password(mpin, current_user.get("mpin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect MPIN"
        )
    
    return {"message": "MPIN verified successfully", "verified": True}


@router.get("/mpin-status")
async def get_mpin_status(current_user: dict = Depends(get_current_active_user)):
    """Check if user has set MPIN"""
    return {
        "has_mpin": current_user.get("has_mpin", False),
        "status": current_user.get("status", "registered")
    }

