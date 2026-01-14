from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_active_user
from app.db.mongodb import get_database
from app.models.user import User, UserUpdate
from bson import ObjectId

router = APIRouter()


@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    """Get current user with populated document URLs"""
    db = get_database()
    
    current_user["id"] = str(current_user.pop("_id"))
    
    # Populate document URLs from files collection
    if current_user.get("documents"):
        documents = current_user.get("documents", {})
        populated_docs = {}
        
        for doc_type, file_id in documents.items():
            if file_id and ObjectId.is_valid(file_id):
                file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
                if file_doc and file_doc.get("status") == "active":
                    # Return relative path (frontend baseURL already includes /api/v1)
                    populated_docs[doc_type] = f"/documents/file/{file_id}"
        
        current_user["documents"] = populated_docs if populated_docs else None
    
    return User(**current_user)


@router.put("/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update current user"""
    db = get_database()
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        from app.core.security import get_password_hash
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    if update_data:
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow()
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    updated_user["id"] = str(updated_user.pop("_id"))
    
    return User(**updated_user)

