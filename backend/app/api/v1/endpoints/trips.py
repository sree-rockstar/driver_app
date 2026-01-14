from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from app.models.trip import Trip, TripCreate, TripUpdate
from app.api.deps import get_current_active_user
from app.db.mongodb import get_database

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a new trip entry for the current driver.
    """
    db = get_database()
    
    # Check if trip_id already exists for this user
    existing_trip = await db.trips.find_one({
        "trip_id": trip.trip_id,
        "user_id": str(current_user["_id"])
    })
    
    if existing_trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip with ID '{trip.trip_id}' already exists"
        )
    
    # Create trip document
    trip_dict = trip.dict()
    trip_dict["user_id"] = str(current_user["_id"])
    trip_dict["created_at"] = datetime.utcnow()
    trip_dict["updated_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.trips.insert_one(trip_dict)
    
    # Fetch the created trip
    created_trip = await db.trips.find_one({"_id": result.inserted_id})
    
    return {
        "message": "Trip created successfully",
        "trip_id": trip.trip_id,
        "id": str(created_trip["_id"])
    }


@router.get("/", response_model=List[dict])
async def get_trips(
    current_user: dict = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    site: str = None
):
    """
    Get all trips for the current driver.
    Optional filter by site (e.g., "Microsoft").
    """
    db = get_database()
    query = {"user_id": str(current_user["_id"])}
    
    if site:
        query["site"] = site
    
    trips = await db.trips.find(query).sort("date", 1).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for trip in trips:
        trip["_id"] = str(trip["_id"])
    
    return trips


@router.get("/{trip_id}", response_model=dict)
async def get_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get a specific trip by trip_id.
    """
    db = get_database()
    trip = await db.trips.find_one({
        "trip_id": trip_id,
        "user_id": str(current_user["_id"])
    })
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID '{trip_id}' not found"
        )
    
    trip["_id"] = str(trip["_id"])
    return trip


@router.put("/{trip_id}", response_model=dict)
async def update_trip(
    trip_id: str,
    trip_update: TripUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update an existing trip.
    """
    db = get_database()
    
    # Check if trip exists
    existing_trip = await db.trips.find_one({
        "trip_id": trip_id,
        "user_id": str(current_user["_id"])
    })
    
    if not existing_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID '{trip_id}' not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in trip_update.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update the trip
    await db.trips.update_one(
        {"trip_id": trip_id, "user_id": str(current_user["_id"])},
        {"$set": update_data}
    )
    
    return {
        "message": "Trip updated successfully",
        "trip_id": trip_id
    }


@router.delete("/{trip_id}", response_model=dict)
async def delete_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete a trip.
    """
    db = get_database()
    result = await db.trips.delete_one({
        "trip_id": trip_id,
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID '{trip_id}' not found"
        )
    
    return {
        "message": "Trip deleted successfully",
        "trip_id": trip_id
    }


@router.get("/stats/summary", response_model=dict)
async def get_trip_stats(
    current_user: dict = Depends(get_current_active_user),
    site: str = None
):
    """
    Get trip statistics for the current driver.
    """
    db = get_database()
    query = {"user_id": str(current_user["_id"])}
    
    if site:
        query["site"] = site
    
    # Count total trips
    total_trips = await db.trips.count_documents(query)
    
    # Calculate total kilometers
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_km": {"$sum": "$total_kilometers"},
            "avg_km": {"$avg": "$total_kilometers"}
        }}
    ]
    
    stats = await db.trips.aggregate(pipeline).to_list(1)
    
    total_km = stats[0]["total_km"] if stats else 0
    avg_km = stats[0]["avg_km"] if stats else 0
    
    return {
        "total_trips": total_trips,
        "total_kilometers": round(total_km, 2),
        "average_kilometers": round(avg_km, 2),
        "site": site if site else "All"
    }

