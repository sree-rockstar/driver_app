from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_admin_user
from app.db.mongodb import get_database
from app.models.user import User, UserRole
from bson import ObjectId

router = APIRouter()


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


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_admin_user)):
    """Admin: Get application statistics"""
    db = get_database()
    
    total_users = await db.users.count_documents({})
    total_drivers = await db.drivers.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    
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


