from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.api.deps import get_current_admin_user
from app.db.mongodb import get_database
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()


class AdminUserCreate(BaseModel):
    mobile_number: str
    full_name: str
    email: Optional[str] = None
    role: str = "driver"  # Accept any role as string
    driving_license_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    status: str = "pending_approval"


@router.get("/users", response_model=List[User])
async def list_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: List all users"""
    db = get_database()
    
    users_cursor = db.users.find().skip(skip).limit(limit).sort("created_at", -1)
    users = await users_cursor.to_list(length=limit)
    
    for user in users:
        user["id"] = str(user.pop("_id"))
    
    return [User(**user) for user in users]


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: AdminUserCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Create a new user"""
    db = get_database()
    
    # Validate role
    valid_roles = [
        "super_admin", "admin", "manager", "operator", "accountant",
        "hr_staff", "support_staff", "driver", "spare_driver", "user"
    ]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Validate mobile number format
    if not user_data.mobile_number.isdigit() or len(user_data.mobile_number) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be exactly 10 digits"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"mobile_number": user_data.mobile_number})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered"
        )
    
    # Verify status exists
    status_doc = await db.user_statuses.find_one({"code": user_data.status, "is_active": True})
    if not status_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status code: {user_data.status}"
        )
    
    # Create new user
    user_dict = {
        "mobile_number": user_data.mobile_number,
        "full_name": user_data.full_name,
        "email": user_data.email,
        "driving_license_number": user_data.driving_license_number,
        "aadhar_number": user_data.aadhar_number,
        "hashed_password": None,  # Admin-created users don't have password initially
        "role": user_data.role,
        "status": user_data.status,
        "is_verified": False,
        "has_mpin": False,
        "documents": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    created_user["id"] = str(created_user.pop("_id"))
    return User(**created_user)


@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Get a specific user"""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user["id"] = str(user.pop("_id"))
    return User(**user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Delete a user"""
    db = get_database()
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}


@router.put("/users/{user_id}/status")
async def change_user_status(
    user_id: str,
    status_code: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Change user status"""
    db = get_database()
    
    # Verify status exists
    status_doc = await db.user_statuses.find_one({"code": status_code, "is_active": True})
    if not status_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status code: {status_code}"
        )
    
    from datetime import datetime
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": status_code, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "message": f"User status changed to {status_doc['name']}",
        "status": status_code
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    full_name: str = None,
    email: str = None,
    mobile_number: str = None,
    driving_license_number: str = None,
    aadhar_number: str = None,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Update user details"""
    db = get_database()
    
    update_data = {}
    if full_name:
        update_data["full_name"] = full_name
    if email:
        update_data["email"] = email
    if mobile_number:
        # Check if mobile number is already used by another user
        existing = await db.users.find_one({
            "mobile_number": mobile_number,
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already in use"
            )
        update_data["mobile_number"] = mobile_number
    if driving_license_number:
        update_data["driving_license_number"] = driving_license_number
    if aadhar_number:
        update_data["aadhar_number"] = aadhar_number
    
    if update_data:
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["id"] = str(updated_user.pop("_id"))
    
    return User(**updated_user)


@router.put("/users/{user_id}/salary")
async def update_driver_salary(
    user_id: str,
    monthly_salary: float,
    working_days: int = None,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Update driver's monthly salary and working days"""
    db = get_database()
    
    # Validate salary is non-negative
    if monthly_salary < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salary cannot be negative"
        )
    
    # Validate working days if provided
    if working_days is not None and (working_days < 1 or working_days > 31):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Working days must be between 1 and 31"
        )
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    from datetime import datetime
    update_data = {
        "monthly_salary": monthly_salary,
        "updated_at": datetime.utcnow()
    }
    
    if working_days is not None:
        update_data["working_days"] = working_days
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Calculate per-day salary if working days is set
    per_day_salary = None
    if working_days and working_days > 0:
        per_day_salary = round(monthly_salary / working_days, 2)
    
    return {
        "message": "Salary updated successfully",
        "user_id": user_id,
        "monthly_salary": monthly_salary,
        "working_days": working_days,
        "per_day_salary": per_day_salary
    }


@router.put("/users/{user_id}/verify")
async def verify_driver(
    user_id: str,
    is_verified: bool,
    verification_notes: Optional[str] = None,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Verify or reject driver documents"""
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update verification status
    update_data = {
        "is_verified": is_verified,
        "updated_at": datetime.utcnow()
    }
    
    if verification_notes:
        update_data["verification_notes"] = verification_notes
    
    # If verifying (approving), also update status to active if not already
    if is_verified and user.get("status") in ["registered", "pending_approval"]:
        update_data["status"] = "active"
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["id"] = str(updated_user.pop("_id"))
    
    return {
        "message": f"Driver {'verified' if is_verified else 'verification rejected'} successfully",
        "user": User(**updated_user)
    }


@router.get("/users/{user_id}/documents")
async def get_user_documents(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Get user's uploaded documents"""
    db = get_database()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    documents = user.get("documents", {})
    
    # Get file details for each document
    document_details = {}
    for doc_field, file_id in documents.items():
        if file_id:
            # Try MongoDB ObjectId first (new format)
            if ObjectId.is_valid(file_id):
                file_record = await db.files.find_one({"_id": ObjectId(file_id)})
            else:
                # Try legacy file_id field (UUID format) - shouldn't happen for user files
                file_record = await db.files.find_one({"file_id": file_id})
            
            if file_record:
                file_record["_id"] = str(file_record["_id"])
                document_details[doc_field] = {
                    "file_id": str(file_record["_id"]),
                    "file_type": file_record.get("file_type"),
                    "filename": file_record.get("filename"),
                    "uploaded_at": file_record.get("uploaded_at"),
                    "file_path": file_record.get("file_path")
                }
    
    return {
        "user_id": user_id,
        "full_name": user.get("full_name"),
        "mobile_number": user.get("mobile_number"),
        "driving_license_number": user.get("driving_license_number"),
        "aadhar_number": user.get("aadhar_number"),
        "is_verified": user.get("is_verified", False),
        "verification_notes": user.get("verification_notes"),
        "documents": document_details
    }


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_admin_user)):
    """Admin: Get application statistics"""
    db = get_database()
    
    total_users = await db.users.count_documents({})
    # Count users with driver or spare_driver role
    total_drivers = await db.users.count_documents({
        "role": {"$in": ["driver", "spare_driver"]}
    })
    # Count active users (users with active status)
    active_users = await db.users.count_documents({"status": "active"})
    
    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "active_users": active_users
    }


@router.get("/trips", response_model=List[dict])
async def get_all_trips(
    current_user: dict = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 1000,
    site: str = None,
    user_id: str = None
):
    """Admin: Get all trips from all drivers with optional filters"""
    db = get_database()
    query = {}
    
    if site:
        query["site"] = site
    if user_id:
        query["user_id"] = user_id
    
    trips = await db.trips.find(query).sort("date", 1).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for trip in trips:
        trip["_id"] = str(trip["_id"])
    
    return trips


