from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_admin_user
from app.db.mongodb import get_database
from app.models.status import UserStatus, UserStatusCreate, UserStatusUpdate
from bson import ObjectId
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[UserStatus])
async def list_statuses(
    include_inactive: bool = False,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: List all user statuses"""
    db = get_database()
    
    query = {} if include_inactive else {"is_active": True}
    
    statuses_cursor = db.user_statuses.find(query).sort("order", 1)
    statuses = await statuses_cursor.to_list(length=100)
    
    for status_doc in statuses:
        status_doc["id"] = str(status_doc.pop("_id"))
    
    return [UserStatus(**status_doc) for status_doc in statuses]


@router.post("/", response_model=UserStatus)
async def create_status(
    status_in: UserStatusCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Create a new user status"""
    db = get_database()
    
    # Check if code already exists
    existing = await db.user_statuses.find_one({"code": status_in.code})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status with code '{status_in.code}' already exists"
        )
    
    status_dict = status_in.model_dump()
    status_dict["created_at"] = datetime.utcnow()
    status_dict["updated_at"] = datetime.utcnow()
    
    result = await db.user_statuses.insert_one(status_dict)
    created_status = await db.user_statuses.find_one({"_id": result.inserted_id})
    
    created_status["id"] = str(created_status.pop("_id"))
    return UserStatus(**created_status)


@router.put("/{status_id}", response_model=UserStatus)
async def update_status(
    status_id: str,
    status_update: UserStatusUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Update a user status"""
    db = get_database()
    
    update_data = status_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.user_statuses.update_one(
            {"_id": ObjectId(status_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Status not found"
            )
    
    updated_status = await db.user_statuses.find_one({"_id": ObjectId(status_id)})
    updated_status["id"] = str(updated_status.pop("_id"))
    
    return UserStatus(**updated_status)


@router.delete("/{status_id}")
async def delete_status(
    status_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin: Delete a user status (soft delete - mark as inactive)"""
    db = get_database()
    
    # Check if any users have this status
    status_doc = await db.user_statuses.find_one({"_id": ObjectId(status_id)})
    if not status_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )
    
    users_with_status = await db.users.count_documents({"status": status_doc["code"]})
    
    if users_with_status > 0:
        # Soft delete - mark as inactive
        await db.user_statuses.update_one(
            {"_id": ObjectId(status_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return {
            "message": f"Status marked as inactive. {users_with_status} users still have this status.",
            "users_affected": users_with_status
        }
    else:
        # Hard delete if no users have this status
        await db.user_statuses.delete_one({"_id": ObjectId(status_id)})
        return {"message": "Status deleted successfully"}


@router.get("/stats")
async def get_status_stats(current_user: dict = Depends(get_current_admin_user)):
    """Admin: Get statistics of users by status"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]
    
    results = await db.users.aggregate(pipeline).to_list(length=100)
    
    # Get status details
    stats = []
    for result in results:
        status_code = result["_id"]
        status_doc = await db.user_statuses.find_one({"code": status_code})
        
        stats.append({
            "status_code": status_code,
            "status_name": status_doc["name"] if status_doc else "Unknown",
            "color": status_doc["color"] if status_doc else "#6B7280",
            "count": result["count"]
        })
    
    return {"stats": stats}

