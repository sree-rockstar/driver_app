from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_active_user
from app.db.mongodb import get_database
from app.models.driver import Driver, DriverCreate, DriverUpdate
from bson import ObjectId
from datetime import datetime

router = APIRouter()


@router.post("/", response_model=Driver)
async def create_driver(
    driver_in: DriverCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new driver profile"""
    db = get_database()
    
    # Check if driver profile already exists for this user
    existing_driver = await db.drivers.find_one({"user_id": driver_in.user_id})
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver profile already exists"
        )
    
    driver_dict = driver_in.model_dump()
    driver_dict["created_at"] = datetime.utcnow()
    driver_dict["updated_at"] = datetime.utcnow()
    driver_dict["rating"] = 0.0
    driver_dict["total_trips"] = 0
    
    result = await db.drivers.insert_one(driver_dict)
    created_driver = await db.drivers.find_one({"_id": result.inserted_id})
    
    created_driver["id"] = str(created_driver.pop("_id"))
    return Driver(**created_driver)


@router.get("/", response_model=List[Driver])
async def list_drivers(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_active_user)
):
    """List all drivers"""
    db = get_database()
    
    drivers_cursor = db.drivers.find().skip(skip).limit(limit)
    drivers = await drivers_cursor.to_list(length=limit)
    
    for driver in drivers:
        driver["id"] = str(driver.pop("_id"))
    
    return [Driver(**driver) for driver in drivers]


@router.get("/{driver_id}", response_model=Driver)
async def get_driver(
    driver_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get a specific driver"""
    db = get_database()
    
    driver = await db.drivers.find_one({"_id": ObjectId(driver_id)})
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    driver["id"] = str(driver.pop("_id"))
    return Driver(**driver)


@router.put("/{driver_id}", response_model=Driver)
async def update_driver(
    driver_id: str,
    driver_update: DriverUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update a driver"""
    db = get_database()
    
    update_data = driver_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.drivers.update_one(
            {"_id": ObjectId(driver_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found"
            )
    
    updated_driver = await db.drivers.find_one({"_id": ObjectId(driver_id)})
    updated_driver["id"] = str(updated_driver.pop("_id"))
    
    return Driver(**updated_driver)


