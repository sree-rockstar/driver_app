from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from ....db.mongodb import get_database
from ....models.trip_type import TripType, TripTypeCreate, TripTypeUpdate
from ...deps import get_current_admin_user

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_trip_type(
    trip_type: TripTypeCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new trip type (Admin only).
    """
    db = get_database()
    
    # Check if trip type with same name already exists
    existing = await db.trip_types.find_one({"name": trip_type.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip type with this name already exists"
        )
    
    trip_type_dict = trip_type.dict()
    trip_type_dict["created_at"] = datetime.utcnow()
    trip_type_dict["updated_at"] = datetime.utcnow()
    
    result = await db.trip_types.insert_one(trip_type_dict)
    
    return {
        "message": "Trip type created successfully",
        "id": str(result.inserted_id)
    }


@router.get("/", response_model=List[dict])
async def get_trip_types(
    include_inactive: bool = False
):
    """
    Get all trip types. By default, only returns active ones.
    """
    db = get_database()
    
    query = {} if include_inactive else {"is_active": True}
    
    trip_types = await db.trip_types.find(query).sort("name", 1).to_list(100)
    
    # Convert ObjectId to string
    for trip_type in trip_types:
        trip_type["_id"] = str(trip_type["_id"])
    
    return trip_types


@router.get("/{trip_type_id}", response_model=dict)
async def get_trip_type(
    trip_type_id: str
):
    """
    Get a specific trip type by ID.
    """
    db = get_database()
    
    if not ObjectId.is_valid(trip_type_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip type ID"
        )
    
    trip_type = await db.trip_types.find_one({"_id": ObjectId(trip_type_id)})
    
    if not trip_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip type not found"
        )
    
    trip_type["_id"] = str(trip_type["_id"])
    return trip_type


@router.put("/{trip_type_id}", response_model=dict)
async def update_trip_type(
    trip_type_id: str,
    trip_type_update: TripTypeUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Update a trip type (Admin only).
    """
    db = get_database()
    
    if not ObjectId.is_valid(trip_type_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip type ID"
        )
    
    # Check if trip type exists
    existing = await db.trip_types.find_one({"_id": ObjectId(trip_type_id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip type not found"
        )
    
    # Check if name is being changed and if it conflicts
    if trip_type_update.name and trip_type_update.name != existing["name"]:
        name_exists = await db.trip_types.find_one({
            "name": trip_type_update.name,
            "_id": {"$ne": ObjectId(trip_type_id)}
        })
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trip type with this name already exists"
            )
    
    update_data = trip_type_update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.trip_types.update_one(
            {"_id": ObjectId(trip_type_id)},
            {"$set": update_data}
        )
    
    return {"message": "Trip type updated successfully"}


@router.delete("/{trip_type_id}", response_model=dict)
async def delete_trip_type(
    trip_type_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Delete a trip type (Admin only).
    """
    db = get_database()
    
    if not ObjectId.is_valid(trip_type_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip type ID"
        )
    
    result = await db.trip_types.delete_one({"_id": ObjectId(trip_type_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip type not found"
        )
    
    return {"message": "Trip type deleted successfully"}

