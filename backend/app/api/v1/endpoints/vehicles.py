from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Body, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime, timedelta

from app.models.vehicle import (
    Vehicle, VehicleCreate, VehicleUpdate, VehicleStatus, FuelType
)
from app.models.vehicle_assignment import (
    Assignment, AssignmentCreate, AssignmentUpdate, AssignmentType, AssignmentStatus
)
from app.models.charging_session import (
    ChargingSession, ChargingSessionCreate, ChargingSessionComplete, 
    ChargingStatus, calculate_charging_metrics
)
from app.models.battery_health import (
    BatteryHealth, BatteryHealthCreate, 
    calculate_battery_health, calculate_degradation_rate,
    get_battery_service_recommendations
)
from app.models.vehicle_maintenance import (
    Maintenance, MaintenanceCreate, MaintenanceUpdate,
    MaintenanceType, MaintenanceStatus,
    is_maintenance_overdue, get_maintenance_priority
)
from app.models.vehicle_expense import (
    Expense, ExpenseCreate, ExpenseUpdate, ExpenseType,
    get_expense_summary, compare_fuel_vs_charging_costs,
    calculate_cost_per_km
)
# User is returned as dict from get_current_user dependency
from app.api import deps
from app.db.mongodb import get_database

router = APIRouter()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle: VehicleCreate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Create a new vehicle (Admin/Super Admin only)
    
    Required fields:
    - vehicle_id: Unique identifier (e.g., VEH001)
    - registration_number: License plate number
    - make: Manufacturer
    - model: Model name
    - year: Manufacturing year
    - fuel_type: petrol, diesel, electric, cng, hybrid
    - odometer_reading: Current km reading
    
    For electric vehicles (is_electric=True):
    - ev_details: Battery capacity, range, charging type, etc.
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Only Admin or Super Admin can create vehicles."
        )
    
    # Check if vehicle_id or registration_number already exists
    existing = await db.vehicles.find_one({
        "$or": [
            {"vehicle_id": vehicle.vehicle_id},
            {"registration_number": vehicle.registration_number}
        ]
    })
    
    if existing:
        if existing.get("vehicle_id") == vehicle.vehicle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle ID '{vehicle.vehicle_id}' already exists"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration number '{vehicle.registration_number}' already exists"
            )
    
    # Validate EV details
    if vehicle.is_electric and not vehicle.ev_details:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="EV details are required for electric vehicles"
        )
    
    # Prepare vehicle document
    vehicle_dict = vehicle.model_dump()
    vehicle_dict["created_at"] = datetime.utcnow()
    vehicle_dict["updated_at"] = datetime.utcnow()
    vehicle_dict["created_by"] = current_user.get("user_id") or current_user.get("mobile_number")
    
    # Insert vehicle
    result = await db.vehicles.insert_one(vehicle_dict)
    
    # Get created vehicle
    created_vehicle = await db.vehicles.find_one({"_id": result.inserted_id})
    created_vehicle["_id"] = str(created_vehicle["_id"])
    
    return {
        "message": "Vehicle created successfully",
        "vehicle": created_vehicle
    }


@router.get("", response_model=dict)
async def list_vehicles(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    is_electric: Optional[bool] = Query(None, description="Filter electric vehicles"),
    search: Optional[str] = Query(None, description="Search by vehicle_id, registration, make, or model"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    List all vehicles with filters and pagination
    
    Filters:
    - status: available, in_use, maintenance, charging, inactive
    - fuel_type: petrol, diesel, electric, cng, hybrid
    - is_electric: true/false
    - search: Search in vehicle_id, registration_number, make, model
    """
    # Build query
    query = {}
    
    if status:
        query["status"] = status
    
    if fuel_type:
        query["fuel_type"] = fuel_type
    
    if is_electric is not None:
        query["is_electric"] = is_electric
    
    if search:
        query["$or"] = [
            {"vehicle_id": {"$regex": search, "$options": "i"}},
            {"registration_number": {"$regex": search, "$options": "i"}},
            {"make": {"$regex": search, "$options": "i"}},
            {"model": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.vehicles.count_documents(query)
    
    # Get vehicles
    cursor = db.vehicles.find(query).skip(skip).limit(limit).sort("created_at", -1)
    vehicles = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for vehicle in vehicles:
        vehicle["_id"] = str(vehicle["_id"])
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "vehicles": vehicles
    }


@router.get("/available", response_model=dict)
async def get_available_vehicles(
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all available vehicles (not assigned, not in maintenance)
    """
    query = {"status": VehicleStatus.AVAILABLE}
    
    if fuel_type:
        query["fuel_type"] = fuel_type
    
    cursor = db.vehicles.find(query).sort("vehicle_id", 1)
    vehicles = await cursor.to_list(length=100)
    
    for vehicle in vehicles:
        vehicle["_id"] = str(vehicle["_id"])
    
    return {
        "total": len(vehicles),
        "vehicles": vehicles
    }


@router.get("/statistics", response_model=dict)
async def get_fleet_statistics(
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get fleet statistics overview
    
    Returns counts by:
    - Total vehicles
    - Status (available, in_use, maintenance, charging)
    - Fuel type (electric vs fuel vehicles)
    - Alerts (insurance expiring, maintenance due)
    """
    # Count by status
    total = await db.vehicles.count_documents({})
    available = await db.vehicles.count_documents({"status": VehicleStatus.AVAILABLE})
    in_use = await db.vehicles.count_documents({"status": VehicleStatus.IN_USE})
    maintenance = await db.vehicles.count_documents({"status": VehicleStatus.MAINTENANCE})
    charging = await db.vehicles.count_documents({"status": VehicleStatus.CHARGING})
    inactive = await db.vehicles.count_documents({"status": VehicleStatus.INACTIVE})
    
    # Count by fuel type
    electric = await db.vehicles.count_documents({"is_electric": True})
    fuel = await db.vehicles.count_documents({"is_electric": False})
    
    # Documents expiring soon (next 30 days)
    thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
    insurance_expiring = await db.vehicles.count_documents({
        "insurance_expiry": {"$lte": thirty_days_from_now, "$gte": datetime.utcnow()}
    })
    
    # Documents expired
    insurance_expired = await db.vehicles.count_documents({
        "insurance_expiry": {"$lt": datetime.utcnow()}
    })
    
    return {
        "total_vehicles": total,
        "by_status": {
            "available": available,
            "in_use": in_use,
            "maintenance": maintenance,
            "charging": charging,
            "inactive": inactive
        },
        "by_fuel_type": {
            "electric": electric,
            "fuel": fuel
        },
        "alerts": {
            "insurance_expiring_soon": insurance_expiring,
            "insurance_expired": insurance_expired
        }
    }


@router.get("/electric", response_model=dict)
async def get_electric_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    low_battery: bool = Query(False, description="Filter vehicles with battery < 20%"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all electric vehicles with battery status
    
    Special filters:
    - low_battery: true - Shows only EVs with battery < 20%
    """
    query = {"is_electric": True}
    
    if low_battery:
        query["ev_details.current_battery_level"] = {"$lt": 20}
    
    # Get total count
    total = await db.vehicles.count_documents(query)
    
    # Get vehicles
    cursor = db.vehicles.find(query).skip(skip).limit(limit).sort("vehicle_id", 1)
    vehicles = await cursor.to_list(length=limit)
    
    for vehicle in vehicles:
        vehicle["_id"] = str(vehicle["_id"])
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "vehicles": vehicles
    }


@router.get("/{vehicle_id}", response_model=dict)
async def get_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get vehicle details by vehicle_id
    
    Returns complete vehicle information including:
    - Basic info
    - Documents and photos
    - Current assignment
    - EV details (if electric)
    """
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    vehicle["_id"] = str(vehicle["_id"])
    
    # Get current assignment if exists
    if vehicle.get("current_driver_id"):
        assignment = await db.vehicle_assignments.find_one({
            "vehicle_id": vehicle_id,
            "status": "active"
        })
        if assignment:
            assignment["_id"] = str(assignment["_id"])
            vehicle["current_assignment"] = assignment
    
    return {"vehicle": vehicle}


@router.put("/{vehicle_id}", response_model=dict)
async def update_vehicle(
    vehicle_id: str,
    vehicle_update: VehicleUpdate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Update vehicle details (Admin/Super Admin only)
    
    Can update any field except vehicle_id and registration_number (use separate endpoints)
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Prepare update data (only non-None fields)
    update_data = {k: v for k, v in vehicle_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update vehicle
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {"$set": update_data}
    )
    
    # Get updated vehicle
    updated_vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    updated_vehicle["_id"] = str(updated_vehicle["_id"])
    
    return {
        "message": "Vehicle updated successfully",
        "vehicle": updated_vehicle
    }


@router.patch("/{vehicle_id}/status", response_model=dict)
async def update_vehicle_status(
    vehicle_id: str,
    new_status: VehicleStatus,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Update vehicle status
    
    Allowed statuses:
    - available: Ready for assignment
    - in_use: Currently assigned to a driver
    - maintenance: Under maintenance
    - charging: Being charged (EV only)
    - inactive: Not in service
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Validate charging status for non-EV
    if new_status == VehicleStatus.CHARGING and not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles can have 'charging' status"
        )
    
    # Update status
    result = await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Vehicle status updated to '{new_status}'",
        "vehicle_id": vehicle_id,
        "new_status": new_status
    }


@router.delete("/{vehicle_id}", response_model=dict)
async def delete_vehicle(
    vehicle_id: str,
    permanent: bool = Query(False, description="Permanently delete (true) or soft delete (false)"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Delete vehicle (Admin/Super Admin only)
    
    By default, performs soft delete (sets status to inactive)
    Use permanent=true to permanently delete (use with caution!)
    
    Cannot delete vehicle with active assignments
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Check if vehicle has active assignments
    active_assignment = await db.vehicle_assignments.find_one({
        "vehicle_id": vehicle_id,
        "status": "active"
    })
    
    if active_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete vehicle with active assignments. Unassign first."
        )
    
    if permanent:
        # Permanent delete - use with caution!
        await db.vehicles.delete_one({"vehicle_id": vehicle_id})
        message = "Vehicle permanently deleted"
    else:
        # Soft delete - set to inactive
        await db.vehicles.update_one(
            {"vehicle_id": vehicle_id},
            {
                "$set": {
                    "status": VehicleStatus.INACTIVE,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        message = "Vehicle deactivated (soft delete)"
    
    return {
        "message": message,
        "vehicle_id": vehicle_id
    }


# ============================================================================
# VEHICLE ASSIGNMENT ENDPOINTS
# ============================================================================

@router.post("/{vehicle_id}/assign", response_model=dict, status_code=status.HTTP_201_CREATED)
async def assign_vehicle_to_driver(
    vehicle_id: str,
    driver_id: str = Body(..., embed=True),
    assignment_type: str = Body("permanent", embed=True),
    assigned_until: Optional[datetime] = Body(None, embed=True),
    trip_id: Optional[str] = Body(None, embed=True),
    notes: Optional[str] = Body(None, embed=True),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Assign vehicle to a driver
    
    Required:
    - driver_id: User ID of the driver
    
    Optional:
    - assignment_type: permanent, temporary, trip_specific (default: permanent)
    - assigned_until: End date for temporary assignments
    - trip_id: Trip ID for trip-specific assignments
    - notes: Additional notes
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin, Super Admin, or Manager required."
        )
    
    # Validate assignment type
    valid_types = ["permanent", "temporary", "trip_specific"]
    if assignment_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid assignment_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Check if driver exists (search by user_id or mobile_number)
    driver = await db.users.find_one({
        "$or": [
            {"user_id": driver_id},
            {"mobile_number": driver_id}
        ]
    })
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver '{driver_id}' not found"
        )
    
    # Check if vehicle is available
    if vehicle.get("status") not in [VehicleStatus.AVAILABLE, VehicleStatus.IN_USE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is currently '{vehicle.get('status')}' and cannot be assigned"
        )
    
    # Check if vehicle already has an active assignment
    existing_assignment = await db.vehicle_assignments.find_one({
        "vehicle_id": vehicle_id,
        "status": AssignmentStatus.ACTIVE
    })
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is already assigned to driver '{existing_assignment.get('driver_id')}'. Unassign first."
        )
    
    # Create assignment document
    assignment_doc = {
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "assigned_at": datetime.utcnow(),
        "assigned_until": assigned_until,
        "assignment_type": assignment_type,
        "trip_id": trip_id,
        "odometer_at_assignment": vehicle.get("odometer_reading", 0),
        "condition_at_assignment": vehicle.get("condition", "good"),
        "status": AssignmentStatus.ACTIVE,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if notes:
        assignment_doc["notes"] = notes
    
    # Insert assignment
    result = await db.vehicle_assignments.insert_one(assignment_doc)
    
    # Update vehicle
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "current_driver_id": driver_id,
                "current_trip_id": trip_id,
                "status": VehicleStatus.IN_USE,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update driver (search by user_id or mobile_number)
    await db.drivers.update_one(
        {"$or": [{"user_id": driver_id}, {"mobile_number": driver_id}]},
        {
            "$set": {
                "assigned_vehicle_id": vehicle_id,
                "vehicle_assignment_type": assignment_type,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get created assignment
    created_assignment = await db.vehicle_assignments.find_one({"_id": result.inserted_id})
    created_assignment["_id"] = str(created_assignment["_id"])
    
    return {
        "message": "Vehicle assigned successfully",
        "assignment": created_assignment
    }


@router.post("/{vehicle_id}/unassign", response_model=dict)
async def unassign_vehicle_from_driver(
    vehicle_id: str,
    odometer_at_return: Optional[float] = Body(None, embed=True),
    condition_at_return: Optional[str] = Body(None, embed=True),
    return_notes: Optional[str] = Body(None, embed=True),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Unassign vehicle from driver
    
    Optional:
    - odometer_at_return: Odometer reading when vehicle returned
    - condition_at_return: Vehicle condition (excellent, good, fair, needs_repair)
    - return_notes: Notes about vehicle condition, damages, etc.
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Find active assignment
    assignment = await db.vehicle_assignments.find_one({
        "vehicle_id": vehicle_id,
        "status": AssignmentStatus.ACTIVE
    })
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle has no active assignment"
        )
    
    driver_id = assignment.get("driver_id")
    
    # Update assignment - mark as completed
    update_assignment = {
        "status": AssignmentStatus.COMPLETED,
        "returned_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if odometer_at_return is not None:
        update_assignment["odometer_at_return"] = odometer_at_return
        # Update vehicle odometer if provided
        await db.vehicles.update_one(
            {"vehicle_id": vehicle_id},
            {"$set": {"odometer_reading": odometer_at_return}}
        )
    
    if condition_at_return:
        update_assignment["condition_at_return"] = condition_at_return
        # Update vehicle condition if provided
        await db.vehicles.update_one(
            {"vehicle_id": vehicle_id},
            {"$set": {"condition": condition_at_return}}
        )
    
    if return_notes:
        update_assignment["return_notes"] = return_notes
    
    await db.vehicle_assignments.update_one(
        {"_id": assignment["_id"]},
        {"$set": update_assignment}
    )
    
    # Update vehicle - make available
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "status": VehicleStatus.AVAILABLE,
                "current_driver_id": None,
                "current_trip_id": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update driver (search by user_id or mobile_number)
    await db.drivers.update_one(
        {"$or": [{"user_id": driver_id}, {"mobile_number": driver_id}]},
        {
            "$set": {
                "assigned_vehicle_id": None,
                "vehicle_assignment_type": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Vehicle unassigned successfully",
        "vehicle_id": vehicle_id,
        "driver_id": driver_id
    }


@router.get("/{vehicle_id}/assignments", response_model=dict)
async def get_vehicle_assignments(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get assignment history for a vehicle
    
    Returns all assignments (active, completed, cancelled) sorted by most recent first
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Get total count
    total = await db.vehicle_assignments.count_documents({"vehicle_id": vehicle_id})
    
    # Get assignments
    cursor = db.vehicle_assignments.find({"vehicle_id": vehicle_id}).skip(skip).limit(limit).sort("assigned_at", -1)
    assignments = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string and add driver info
    for assignment in assignments:
        assignment["_id"] = str(assignment["_id"])
        
        # Get driver details
        driver = await db.users.find_one({"user_id": assignment.get("driver_id")})
        if driver:
            assignment["driver_name"] = driver.get("full_name", "Unknown")
            assignment["driver_phone"] = driver.get("phone_number", "")
    
    return {
        "vehicle_id": vehicle_id,
        "total": total,
        "skip": skip,
        "limit": limit,
        "assignments": assignments
    }


@router.get("/{vehicle_id}/current-assignment", response_model=dict)
async def get_current_assignment(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get current active assignment for a vehicle
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Find active assignment
    assignment = await db.vehicle_assignments.find_one({
        "vehicle_id": vehicle_id,
        "status": AssignmentStatus.ACTIVE
    })
    
    if not assignment:
        return {
            "vehicle_id": vehicle_id,
            "has_assignment": False,
            "assignment": None
        }
    
    assignment["_id"] = str(assignment["_id"])
    
    # Get driver details
    driver = await db.users.find_one({"user_id": assignment.get("driver_id")})
    if driver:
        assignment["driver_name"] = driver.get("full_name", "Unknown")
        assignment["driver_phone"] = driver.get("phone_number", "")
        assignment["driver_role"] = driver.get("role", "")
    
    # Get trip details if trip-specific
    if assignment.get("trip_id"):
        trip = await db.trips.find_one({"trip_id": assignment.get("trip_id")})
        if trip:
            trip["_id"] = str(trip["_id"])
            assignment["trip_details"] = {
                "trip_id": trip.get("trip_id"),
                "site": trip.get("site"),
                "date": trip.get("date"),
                "source": trip.get("source_point"),
                "destination": trip.get("destination")
            }
    
    return {
        "vehicle_id": vehicle_id,
        "has_assignment": True,
        "assignment": assignment
    }


# ============================================================================
# CHARGING SESSION ENDPOINTS (Electric Vehicles)
# ============================================================================

@router.post("/{vehicle_id}/charging/start", response_model=dict, status_code=status.HTTP_201_CREATED)
async def start_charging_session(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Start a charging session for an electric vehicle
    
    Simply records the start time. Driver will complete the session later with charging details.
    
    Permissions: Admin, Super Admin, Manager, Operator, Driver (own vehicle)
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Check if vehicle is electric
    if not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles can have charging sessions"
        )
    
    # Permission check - driver can only start charging for their assigned vehicle
    user_role = current_user.get("role")
    if user_role in ["driver", "spare_driver"]:
        user_mobile = current_user.get("mobile_number")
        user_id = current_user.get("user_id")
        if vehicle.get("current_driver_id") != user_mobile and vehicle.get("current_driver_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only start charging for your assigned vehicle"
            )
    elif user_role not in ["admin", "super_admin", "manager", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if there's already an active charging session
    existing_session = await db.charging_sessions.find_one({
        "vehicle_id": vehicle_id,
        "status": ChargingStatus.IN_PROGRESS
    })
    
    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already has an active charging session"
        )
    
    # Create charging session
    session_doc = {
        "vehicle_id": vehicle_id,
        "driver_id": current_user.get("user_id") or current_user.get("mobile_number"),
        "started_at": datetime.utcnow(),
        "status": ChargingStatus.IN_PROGRESS,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.charging_sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    # Update vehicle status to charging
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "status": VehicleStatus.CHARGING,
                "ev_details.charging_status": "charging",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Charging session started",
        "session_id": session_id,
        "vehicle_id": vehicle_id,
        "started_at": datetime.utcnow().isoformat()
    }


@router.post("/{vehicle_id}/charging/end", response_model=dict)
async def end_charging_session(
    vehicle_id: str,
    charging_data: ChargingSessionComplete,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Complete a charging session - User enters 5 required fields
    
    REQUIRED FIELDS (from user):
    1. start_soc: Battery % at start (0-100)
    2. end_soc: Battery % at end (0-100)
    3. kw_consumed: Energy consumed in kWh
    4. amount: Total cost paid in ₹
    5. charging_station_name: Station name and location
    
    OPTIONAL FIELDS:
    - charging_type: ac_slow, ac_fast, dc_fast, home
    - payment_method: cash, card, upi
    - receipt_file_id: Uploaded receipt
    - odometer_reading: Current km reading
    - notes: Additional notes
    
    AUTO-CALCULATED:
    - soc_charged: end_soc - start_soc
    - cost_per_kwh: amount / kw_consumed
    - duration: end_time - start_time
    
    Permissions: Same as start (driver for own vehicle, admin/manager for any)
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Permission check
    user_role = current_user.get("role")
    if user_role in ["driver", "spare_driver"]:
        if vehicle.get("current_driver_id") != current_user.get("user_id") and vehicle.get("current_driver_id") != current_user.get("mobile_number"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only end charging for your assigned vehicle"
            )
    elif user_role not in ["admin", "super_admin", "manager", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Find active charging session
    session = await db.charging_sessions.find_one({
        "vehicle_id": vehicle_id,
        "status": ChargingStatus.IN_PROGRESS
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active charging session found for this vehicle"
        )
    
    # Validate SOC values
    if charging_data.end_soc <= charging_data.start_soc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End SOC must be greater than Start SOC"
        )
    
    # Calculate auto-fields
    metrics = calculate_charging_metrics(charging_data)
    ended_at = datetime.utcnow()
    started_at = session.get("started_at")
    duration_minutes = int((ended_at - started_at).total_seconds() / 60) if started_at else 0
    
    # Update charging session
    update_data = {
        "start_soc": charging_data.start_soc,
        "end_soc": charging_data.end_soc,
        "kw_consumed": charging_data.kw_consumed,
        "amount": charging_data.amount,
        "charging_station_name": charging_data.charging_station_name,
        "soc_charged": metrics["soc_charged"],
        "cost_per_kwh": metrics["cost_per_kwh"],
        "ended_at": ended_at,
        "duration_minutes": duration_minutes,
        "status": ChargingStatus.COMPLETED,
        "updated_at": datetime.utcnow()
    }
    
    # Add optional fields if provided
    if charging_data.charging_type:
        update_data["charging_type"] = charging_data.charging_type
    if charging_data.payment_method:
        update_data["payment_method"] = charging_data.payment_method
    if charging_data.receipt_file_id:
        update_data["receipt_file_id"] = charging_data.receipt_file_id
    if charging_data.odometer_reading:
        update_data["odometer_reading"] = charging_data.odometer_reading
    if charging_data.notes:
        update_data["notes"] = charging_data.notes
    if charging_data.trip_id:
        update_data["trip_id"] = charging_data.trip_id
    
    await db.charging_sessions.update_one(
        {"_id": session["_id"]},
        {"$set": update_data}
    )
    
    # Update vehicle battery level and status
    vehicle_updates = {
        "status": VehicleStatus.AVAILABLE if vehicle.get("status") == VehicleStatus.CHARGING else vehicle.get("status"),
        "ev_details.current_battery_level": charging_data.end_soc,
        "ev_details.last_charged_at": ended_at,
        "ev_details.charging_status": "fully_charged" if charging_data.end_soc >= 95 else "not_charging",
        "updated_at": datetime.utcnow()
    }
    
    # Increment charging cycles if charged > 80%
    if metrics["soc_charged"] >= 80:
        vehicle_updates["$inc"] = {"ev_details.charging_cycles": 1}
    
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {"$set": vehicle_updates}
    )
    
    # Create expense record for this charging session
    expense_doc = {
        "vehicle_id": vehicle_id,
        "expense_type": ExpenseType.CHARGING,
        "amount": charging_data.amount,
        "date": ended_at,
        "description": f"Charging at {charging_data.charging_station_name}",
        "charging_session_id": str(session["_id"]),
        "kw_consumed": charging_data.kw_consumed,
        "start_soc": charging_data.start_soc,
        "end_soc": charging_data.end_soc,
        "charging_station_name": charging_data.charging_station_name,
        "cost_per_kwh": metrics["cost_per_kwh"],
        "driver_id": current_user.get("user_id") or current_user.get("mobile_number"),
        "trip_id": charging_data.trip_id,
        "payment_method": charging_data.payment_method,
        "receipt_file_id": charging_data.receipt_file_id,
        "odometer_reading": charging_data.odometer_reading,
        "created_at": datetime.utcnow(),
        "created_by": current_user.get("user_id") or current_user.get("mobile_number"),
        "updated_at": datetime.utcnow()
    }
    
    await db.vehicle_expenses.insert_one(expense_doc)
    
    # Get completed session
    completed_session = await db.charging_sessions.find_one({"_id": session["_id"]})
    completed_session["_id"] = str(completed_session["_id"])
    
    return {
        "message": "Charging session completed successfully",
        "session": completed_session,
        "metrics": {
            "soc_charged": f"{metrics['soc_charged']}%",
            "cost_per_kwh": f"₹{metrics['cost_per_kwh']}",
            "duration": f"{duration_minutes} minutes",
            "total_cost": f"₹{charging_data.amount}"
        }
    }


@router.get("/{vehicle_id}/charging/sessions", response_model=dict)
async def get_charging_sessions(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get charging session history for a vehicle
    
    Returns all completed charging sessions with:
    - Start/End SOC
    - kW consumed
    - Amount paid
    - Station name
    - Duration
    - Auto-calculated metrics
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Check if vehicle is electric
    if not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles have charging sessions"
        )
    
    # Get total count
    total = await db.charging_sessions.count_documents({"vehicle_id": vehicle_id})
    
    # Get sessions
    cursor = db.charging_sessions.find({"vehicle_id": vehicle_id}).skip(skip).limit(limit).sort("started_at", -1)
    sessions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string and add driver info
    for session in sessions:
        session["_id"] = str(session["_id"])
        
        # Get driver details
        driver = await db.users.find_one({"user_id": session.get("driver_id")})
        if driver:
            session["driver_name"] = driver.get("full_name", "Unknown")
    
    # Calculate summary stats
    total_kwh = sum(s.get("kw_consumed", 0) for s in sessions if s.get("kw_consumed"))
    total_cost = sum(s.get("amount", 0) for s in sessions if s.get("amount"))
    avg_cost_per_kwh = (total_cost / total_kwh) if total_kwh > 0 else 0
    
    return {
        "vehicle_id": vehicle_id,
        "total": total,
        "skip": skip,
        "limit": limit,
        "sessions": sessions,
        "summary": {
            "total_sessions": len(sessions),
            "total_kwh": round(total_kwh, 2),
            "total_cost": round(total_cost, 2),
            "avg_cost_per_kwh": round(avg_cost_per_kwh, 2)
        }
    }


@router.get("/{vehicle_id}/charging/current", response_model=dict)
async def get_current_charging_session(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get current active charging session (if any)
    
    Returns session details with elapsed time
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Find active session
    session = await db.charging_sessions.find_one({
        "vehicle_id": vehicle_id,
        "status": ChargingStatus.IN_PROGRESS
    })
    
    if not session:
        return {
            "vehicle_id": vehicle_id,
            "is_charging": False,
            "session": None
        }
    
    session["_id"] = str(session["_id"])
    
    # Calculate elapsed time
    started_at = session.get("started_at")
    if started_at:
        elapsed = datetime.utcnow() - started_at
        elapsed_minutes = int(elapsed.total_seconds() / 60)
        session["elapsed_minutes"] = elapsed_minutes
        session["elapsed_formatted"] = f"{elapsed_minutes // 60}h {elapsed_minutes % 60}m"
    
    return {
        "vehicle_id": vehicle_id,
        "is_charging": True,
        "session": session
    }


@router.get("/{vehicle_id}/charging/cost", response_model=dict)
async def get_charging_cost_analytics(
    vehicle_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get charging cost analytics for a vehicle
    
    Returns:
    - Total charging cost
    - Total kWh consumed
    - Average cost per session
    - Average cost per kWh
    - Most used charging stations
    - Cost trend over time
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Get sessions from last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    
    cursor = db.charging_sessions.find({
        "vehicle_id": vehicle_id,
        "status": ChargingStatus.COMPLETED,
        "started_at": {"$gte": start_date}
    }).sort("started_at", -1)
    
    sessions = await cursor.to_list(length=1000)
    
    if not sessions:
        return {
            "vehicle_id": vehicle_id,
            "period_days": days,
            "total_sessions": 0,
            "analytics": None
        }
    
    # Calculate analytics
    total_cost = sum(s.get("amount", 0) for s in sessions)
    total_kwh = sum(s.get("kw_consumed", 0) for s in sessions)
    avg_cost_per_session = total_cost / len(sessions) if sessions else 0
    avg_cost_per_kwh = total_cost / total_kwh if total_kwh > 0 else 0
    
    # Station usage
    station_usage = {}
    for session in sessions:
        station = session.get("charging_station_name", "Unknown")
        if station not in station_usage:
            station_usage[station] = {"count": 0, "total_cost": 0, "total_kwh": 0}
        station_usage[station]["count"] += 1
        station_usage[station]["total_cost"] += session.get("amount", 0)
        station_usage[station]["total_kwh"] += session.get("kw_consumed", 0)
    
    # Sort stations by usage
    top_stations = sorted(
        [{"station": k, **v} for k, v in station_usage.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:5]
    
    return {
        "vehicle_id": vehicle_id,
        "period_days": days,
        "total_sessions": len(sessions),
        "analytics": {
            "total_cost": round(total_cost, 2),
            "total_kwh": round(total_kwh, 2),
            "avg_cost_per_session": round(avg_cost_per_session, 2),
            "avg_cost_per_kwh": round(avg_cost_per_kwh, 2),
            "top_stations": top_stations
        }
    }


# ============================================================================
# BATTERY HEALTH ENDPOINTS (Electric Vehicles)
# ============================================================================

@router.get("/{vehicle_id}/battery/health", response_model=dict)
async def get_battery_health(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get current battery health for an electric vehicle
    
    Returns:
    - Current battery health percentage
    - Degradation rate
    - Charging cycles
    - Service recommendations
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Check if vehicle is electric
    if not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles have battery health data"
        )
    
    ev_details = vehicle.get("ev_details", {})
    
    # Get latest battery health log
    latest_log = await db.battery_health_logs.find_one(
        {"vehicle_id": vehicle_id},
        sort=[("measured_at", -1)]
    )
    
    if latest_log:
        latest_log["_id"] = str(latest_log["_id"])
    
    # Calculate current metrics from ev_details
    battery_health_pct = ev_details.get("battery_health", 100)
    charging_cycles = ev_details.get("charging_cycles", 0)
    
    # Get recommendations
    degradation = 100 - battery_health_pct
    recommendations = get_battery_service_recommendations(
        battery_health=battery_health_pct,
        degradation_rate=degradation,
        charging_cycles=charging_cycles
    )
    
    return {
        "vehicle_id": vehicle_id,
        "current_health": {
            "battery_health_percentage": battery_health_pct,
            "current_battery_level": ev_details.get("current_battery_level", 0),
            "current_range": ev_details.get("current_range", 0),
            "charging_cycles": charging_cycles,
            "last_charged_at": ev_details.get("last_charged_at")
        },
        "latest_log": latest_log,
        "recommendations": recommendations
    }


@router.post("/{vehicle_id}/battery/log", response_model=dict, status_code=status.HTTP_201_CREATED)
async def log_battery_health(
    vehicle_id: str,
    health_data: BatteryHealthCreate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Log battery health reading (Admin/Super Admin only)
    
    Typically done:
    - After service center visit
    - Monthly assessments
    - When battery issues suspected
    
    Required fields in health_data:
    - battery_health_percentage
    - total_charging_cycles
    - actual_capacity (kWh)
    - original_capacity (kWh)
    - max_range_current (km)
    - avg_consumption (kWh/100km)
    - odometer_reading
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Only Admin or Super Admin can log battery health."
        )
    
    # Check if vehicle exists and is electric
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    if not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles have battery health data"
        )
    
    # Insert health log
    health_dict = health_data.model_dump()
    health_dict["created_at"] = datetime.utcnow()
    
    result = await db.battery_health_logs.insert_one(health_dict)
    
    # Update vehicle ev_details
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                "ev_details.battery_health": health_data.battery_health_percentage,
                "ev_details.charging_cycles": health_data.total_charging_cycles,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get created log
    created_log = await db.battery_health_logs.find_one({"_id": result.inserted_id})
    created_log["_id"] = str(created_log["_id"])
    
    return {
        "message": "Battery health logged successfully",
        "log": created_log
    }


@router.get("/{vehicle_id}/battery/history", response_model=dict)
async def get_battery_health_history(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get battery health history over time
    
    Returns historical battery health readings for trend analysis
    """
    # Check if vehicle exists and is electric
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    if not vehicle.get("is_electric"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only electric vehicles have battery health history"
        )
    
    # Get total count
    total = await db.battery_health_logs.count_documents({"vehicle_id": vehicle_id})
    
    # Get logs
    cursor = db.battery_health_logs.find({"vehicle_id": vehicle_id}).skip(skip).limit(limit).sort("measured_at", -1)
    logs = await cursor.to_list(length=limit)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    # Calculate trend if we have multiple readings
    if len(logs) >= 2:
        first = logs[-1]  # Oldest
        last = logs[0]    # Newest
        health_change = last.get("battery_health_percentage", 0) - first.get("battery_health_percentage", 0)
        trend = "declining" if health_change < 0 else "stable" if health_change == 0 else "improving"
    else:
        trend = "insufficient_data"
    
    return {
        "vehicle_id": vehicle_id,
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": logs,
        "trend": trend
    }


# ============================================================================
# MAINTENANCE ENDPOINTS
# ============================================================================

@router.post("/{vehicle_id}/maintenance", response_model=dict, status_code=status.HTTP_201_CREATED)
async def schedule_maintenance(
    vehicle_id: str,
    maintenance: MaintenanceCreate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Schedule maintenance for a vehicle
    
    Required fields:
    - maintenance_type: routine_service, repair, inspection, etc.
    - description: Description of work
    - scheduled_date: When maintenance is scheduled
    
    Optional fields:
    - service_provider: Service center name
    - cost: Estimated cost
    - parts_replaced: List of parts
    - next_service_km: Next service at km
    - vehicle_unavailable_from/until: Downtime period
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Prepare maintenance document
    maintenance_dict = maintenance.model_dump()
    maintenance_dict["created_at"] = datetime.utcnow()
    maintenance_dict["created_by"] = current_user.user_id
    maintenance_dict["updated_at"] = datetime.utcnow()
    
    # Insert maintenance
    result = await db.vehicle_maintenance.insert_one(maintenance_dict)
    
    # If vehicle will be unavailable, update status
    if maintenance.vehicle_unavailable_from:
        if maintenance.vehicle_unavailable_from <= datetime.utcnow():
            await db.vehicles.update_one(
                {"vehicle_id": vehicle_id},
                {
                    "$set": {
                        "status": VehicleStatus.MAINTENANCE,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    # Get created maintenance
    created_maintenance = await db.vehicle_maintenance.find_one({"_id": result.inserted_id})
    created_maintenance["_id"] = str(created_maintenance["_id"])
    
    return {
        "message": "Maintenance scheduled successfully",
        "maintenance": created_maintenance
    }


@router.get("/{vehicle_id}/maintenance", response_model=dict)
async def get_maintenance_history(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get maintenance history for a vehicle
    
    Filter by status: scheduled, in_progress, completed, cancelled
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Build query
    query = {"vehicle_id": vehicle_id}
    if status_filter:
        query["status"] = status_filter
    
    # Get total count
    total = await db.vehicle_maintenance.count_documents(query)
    
    # Get maintenance records
    cursor = db.vehicle_maintenance.find(query).skip(skip).limit(limit).sort("scheduled_date", -1)
    maintenance_records = await cursor.to_list(length=limit)
    
    # Convert ObjectId and check if overdue
    current_odometer = vehicle.get("odometer_reading", 0)
    for record in maintenance_records:
        record["_id"] = str(record["_id"])
        
        # Check if overdue
        if record.get("status") == MaintenanceStatus.SCHEDULED:
            is_overdue, reason = is_maintenance_overdue(
                next_service_date=record.get("scheduled_date"),
                next_service_km=None,
                current_odometer=current_odometer
            )
            record["is_overdue"] = is_overdue
            record["overdue_reason"] = reason if is_overdue else None
            
            # Get priority
            priority = get_maintenance_priority(
                record.get("maintenance_type"),
                is_overdue
            )
            record["priority"] = priority
    
    # Calculate cost summary
    total_cost = sum(r.get("cost", 0) for r in maintenance_records if r.get("cost"))
    completed_count = sum(1 for r in maintenance_records if r.get("status") == MaintenanceStatus.COMPLETED)
    
    return {
        "vehicle_id": vehicle_id,
        "total": total,
        "skip": skip,
        "limit": limit,
        "maintenance_records": maintenance_records,
        "summary": {
            "total_records": len(maintenance_records),
            "completed": completed_count,
            "total_cost": round(total_cost, 2)
        }
    }


@router.put("/maintenance/{maintenance_id}", response_model=dict)
async def update_maintenance(
    maintenance_id: str,
    maintenance_update: MaintenanceUpdate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Update maintenance record
    
    Can update any field including:
    - status (to in_progress, completed, cancelled)
    - actual_date (when work was done)
    - cost (actual cost)
    - parts_replaced
    - work_done
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if maintenance exists
    from bson import ObjectId
    try:
        maintenance = await db.vehicle_maintenance.find_one({"_id": ObjectId(maintenance_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid maintenance ID"
        )
    
    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in maintenance_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update maintenance
    await db.vehicle_maintenance.update_one(
        {"_id": ObjectId(maintenance_id)},
        {"$set": update_data}
    )
    
    # If status changed to completed, update vehicle status
    if maintenance_update.status == MaintenanceStatus.COMPLETED:
        vehicle_id = maintenance.get("vehicle_id")
        
        # Set vehicle back to available if it was in maintenance
        vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
        if vehicle and vehicle.get("status") == VehicleStatus.MAINTENANCE:
            await db.vehicles.update_one(
                {"vehicle_id": vehicle_id},
                {
                    "$set": {
                        "status": VehicleStatus.AVAILABLE,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Update next service km if provided
        if maintenance_update.next_service_km:
            await db.vehicles.update_one(
                {"vehicle_id": vehicle_id},
                {
                    "$set": {
                        "next_service_km": maintenance_update.next_service_km,
                        "last_service_km": maintenance_update.odometer_reading or vehicle.get("odometer_reading"),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    # Get updated maintenance
    updated_maintenance = await db.vehicle_maintenance.find_one({"_id": ObjectId(maintenance_id)})
    updated_maintenance["_id"] = str(updated_maintenance["_id"])
    
    return {
        "message": "Maintenance updated successfully",
        "maintenance": updated_maintenance
    }


@router.get("/maintenance/upcoming", response_model=dict)
async def get_upcoming_maintenance(
    days: int = Query(30, ge=1, le=365, description="Number of days ahead to check"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all upcoming maintenance across the fleet
    
    Returns maintenance scheduled in the next N days
    """
    end_date = datetime.utcnow() + timedelta(days=days)
    
    cursor = db.vehicle_maintenance.find({
        "status": MaintenanceStatus.SCHEDULED,
        "scheduled_date": {
            "$gte": datetime.utcnow(),
            "$lte": end_date
        }
    }).sort("scheduled_date", 1)
    
    maintenance_records = await cursor.to_list(length=100)
    
    # Add vehicle details
    for record in maintenance_records:
        record["_id"] = str(record["_id"])
        
        # Get vehicle info
        vehicle = await db.vehicles.find_one({"vehicle_id": record.get("vehicle_id")})
        if vehicle:
            record["vehicle_info"] = {
                "registration_number": vehicle.get("registration_number"),
                "make": vehicle.get("make"),
                "model": vehicle.get("model")
            }
        
        # Get priority
        priority = get_maintenance_priority(record.get("maintenance_type"), False)
        record["priority"] = priority
    
    return {
        "period_days": days,
        "total": len(maintenance_records),
        "upcoming_maintenance": maintenance_records
    }


@router.get("/maintenance/overdue", response_model=dict)
async def get_overdue_maintenance(
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all overdue maintenance across the fleet
    
    Returns scheduled maintenance that is past due date
    """
    cursor = db.vehicle_maintenance.find({
        "status": MaintenanceStatus.SCHEDULED,
        "scheduled_date": {"$lt": datetime.utcnow()}
    }).sort("scheduled_date", 1)
    
    maintenance_records = await cursor.to_list(length=100)
    
    # Add vehicle details and calculate days overdue
    for record in maintenance_records:
        record["_id"] = str(record["_id"])
        
        # Calculate days overdue
        scheduled_date = record.get("scheduled_date")
        if scheduled_date:
            days_overdue = (datetime.utcnow() - scheduled_date).days
            record["days_overdue"] = days_overdue
        
        # Get vehicle info
        vehicle = await db.vehicles.find_one({"vehicle_id": record.get("vehicle_id")})
        if vehicle:
            record["vehicle_info"] = {
                "vehicle_id": vehicle.get("vehicle_id"),
                "registration_number": vehicle.get("registration_number"),
                "make": vehicle.get("make"),
                "model": vehicle.get("model"),
                "current_driver": vehicle.get("current_driver_id")
            }
        
        # Get priority (overdue is always higher)
        priority = get_maintenance_priority(record.get("maintenance_type"), True)
        record["priority"] = priority
    
    # Sort by priority and days overdue
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    maintenance_records.sort(
        key=lambda x: (priority_order.get(x.get("priority", "low"), 3), -x.get("days_overdue", 0))
    )
    
    return {
        "total": len(maintenance_records),
        "overdue_maintenance": maintenance_records
    }


# ============================================================================
# EXPENSE ENDPOINTS
# ============================================================================

@router.post("/{vehicle_id}/expenses", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_expense(
    vehicle_id: str,
    expense: ExpenseCreate,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Add an expense for a vehicle
    
    Expense types:
    - fuel: For fuel vehicles (requires fuel_quantity, fuel_price_per_liter)
    - charging: For EVs (auto-created by charging sessions, but can be manual)
    - maintenance: Linked to maintenance records
    - insurance, tax, fine, toll, parking, other
    
    Permissions:
    - Admin/Manager: Can add any expense
    - Accountant: Can add any expense
    - Driver: Can add expenses for their assigned vehicle
    """
    # Check permissions
    if current_user.role in ["driver", "spare_driver"]:
        # Drivers can only add expenses for their assigned vehicle
        vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
        if not vehicle or vehicle.get("current_driver_id") != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add expenses for your assigned vehicle"
            )
    elif user_role not in ["admin", "super_admin", "manager", "accountant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Validate expense type specific fields
    if expense.expense_type == ExpenseType.FUEL:
        if not expense.fuel_quantity or not expense.fuel_price_per_liter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fuel expenses require fuel_quantity and fuel_price_per_liter"
            )
    
    if expense.expense_type == ExpenseType.CHARGING:
        if not expense.kw_consumed or not expense.start_soc or not expense.end_soc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Charging expenses require kw_consumed, start_soc, and end_soc"
            )
    
    # Prepare expense document
    expense_dict = expense.model_dump()
    expense_dict["created_at"] = datetime.utcnow()
    expense_dict["created_by"] = current_user.user_id
    expense_dict["updated_at"] = datetime.utcnow()
    
    # Insert expense
    result = await db.vehicle_expenses.insert_one(expense_dict)
    
    # Get created expense
    created_expense = await db.vehicle_expenses.find_one({"_id": result.inserted_id})
    created_expense["_id"] = str(created_expense["_id"])
    
    return {
        "message": "Expense added successfully",
        "expense": created_expense
    }


@router.get("/{vehicle_id}/expenses", response_model=dict)
async def get_vehicle_expenses(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    expense_type: Optional[str] = Query(None, description="Filter by expense type"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get expenses for a vehicle
    
    Filters:
    - expense_type: fuel, charging, maintenance, insurance, tax, fine, toll, parking
    - start_date/end_date: Date range filter
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Build query
    query = {"vehicle_id": vehicle_id}
    
    if expense_type:
        query["expense_type"] = expense_type
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date
    
    # Get total count
    total = await db.vehicle_expenses.count_documents(query)
    
    # Get expenses
    cursor = db.vehicle_expenses.find(query).skip(skip).limit(limit).sort("date", -1)
    expenses = await cursor.to_list(length=limit)
    
    # Convert ObjectId
    for expense in expenses:
        expense["_id"] = str(expense["_id"])
        
        # Get driver name if available
        if expense.get("driver_id"):
            driver = await db.users.find_one({"user_id": expense.get("driver_id")})
            if driver:
                expense["driver_name"] = driver.get("full_name", "Unknown")
    
    # Calculate summary
    total_amount = sum(e.get("amount", 0) for e in expenses)
    by_type = {}
    for expense in expenses:
        exp_type = expense.get("expense_type")
        if exp_type not in by_type:
            by_type[exp_type] = 0
        by_type[exp_type] += expense.get("amount", 0)
    
    return {
        "vehicle_id": vehicle_id,
        "total": total,
        "skip": skip,
        "limit": limit,
        "expenses": expenses,
        "summary": {
            "total_amount": round(total_amount, 2),
            "by_type": {k: round(v, 2) for k, v in by_type.items()}
        }
    }


@router.get("/{vehicle_id}/expenses/summary", response_model=dict)
async def get_expense_summary_analytics(
    vehicle_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get comprehensive expense analytics for a vehicle
    
    Returns:
    - Total expenses by type
    - Monthly breakdown
    - Cost per kilometer
    - Fuel efficiency (for fuel vehicles)
    - Charging efficiency (for EVs)
    - Top expense categories
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Get expenses from last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    
    cursor = db.vehicle_expenses.find({
        "vehicle_id": vehicle_id,
        "date": {"$gte": start_date}
    }).sort("date", -1)
    
    expenses_list = await cursor.to_list(length=1000)
    
    if not expenses_list:
        return {
            "vehicle_id": vehicle_id,
            "period_days": days,
            "total_expenses": 0,
            "analytics": None
        }
    
    # Use helper function for summary
    from app.models.vehicle_expense import Expense as ExpenseModel
    
    # Convert to Expense objects for helper function
    expense_objects = []
    for exp_dict in expenses_list:
        try:
            exp_dict["_id"] = str(exp_dict["_id"])
            expense_objects.append(ExpenseModel(**exp_dict))
        except:
            pass
    
    summary = get_expense_summary(expense_objects)
    
    # Calculate cost per km
    current_odometer = vehicle.get("odometer_reading", 0)
    # Estimate distance in period (rough estimate)
    trips_in_period = await db.trips.count_documents({
        "vehicle_id": vehicle_id,
        "date": {"$gte": start_date.strftime("%Y-%m-%d")}
    })
    
    return {
        "vehicle_id": vehicle_id,
        "period_days": days,
        "total_expenses": len(expenses_list),
        "analytics": summary,
        "vehicle_info": {
            "current_odometer": current_odometer,
            "trips_in_period": trips_in_period
        }
    }


@router.get("/expenses/fuel-vs-charging", response_model=dict)
async def compare_fuel_and_charging_costs(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Compare fuel costs vs charging costs across the fleet
    
    Useful for:
    - ROI analysis for EVs
    - Cost optimization
    - Decision making for future vehicle purchases
    """
    # Get all expenses from last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    
    cursor = db.vehicle_expenses.find({
        "date": {"$gte": start_date},
        "expense_type": {"$in": [ExpenseType.FUEL, ExpenseType.CHARGING]}
    })
    
    expenses_list = await cursor.to_list(length=10000)
    
    if not expenses_list:
        return {
            "period_days": days,
            "comparison": None
        }
    
    # Convert to Expense objects
    from app.models.vehicle_expense import Expense as ExpenseModel
    expense_objects = []
    for exp_dict in expenses_list:
        try:
            exp_dict["_id"] = str(exp_dict["_id"])
            expense_objects.append(ExpenseModel(**exp_dict))
        except:
            pass
    
    # Use helper function for comparison
    comparison = compare_fuel_vs_charging_costs(expense_objects)
    
    return {
        "period_days": days,
        "comparison": comparison
    }


# ============================================================================
# DOCUMENT & PHOTO UPLOAD ENDPOINTS
# ============================================================================

@router.post("/{vehicle_id}/documents/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_vehicle_document(
    vehicle_id: str,
    document_type: str = Form(..., description="rc, insurance, pollution, fitness, permit, road_tax"),
    expiry_date: Optional[str] = Form(None, description="Document expiry date (YYYY-MM-DD)"),
    file: UploadFile = File(...),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Upload vehicle document (RC, Insurance, Pollution Certificate, etc.)
    
    Document types:
    - rc: Registration Certificate (MANDATORY)
    - insurance: Insurance Policy (MANDATORY)
    - pollution: Pollution Certificate
    - fitness: Fitness Certificate
    - permit: Commercial Permit
    - road_tax: Road Tax Receipt
    
    Permissions: Admin, Super Admin only
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Only Admin or Super Admin can upload documents."
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Validate document type
    valid_types = ["rc", "insurance", "pollution", "fitness", "permit", "road_tax"]
    if document_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate file type
    allowed_extensions = ["pdf", "jpg", "jpeg", "png"]
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (max 5MB)
    file_content = await file.read()
    file_size = len(file_content)
    max_size = 5 * 1024 * 1024  # 5MB
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: 5MB"
        )
    
    # Save file
    import uuid
    from pathlib import Path
    
    upload_dir = Path(f"uploads/vehicles/{vehicle_id}/documents")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_path = upload_dir / f"{document_type}_{file_id}.{file_ext}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create file record
    file_doc = {
        "file_id": file_id,
        "vehicle_id": vehicle_id,
        "file_type": f"vehicle_{document_type}",
        "document_type": document_type,
        "file_path": str(file_path),
        "original_filename": file.filename,
        "file_size": file_size,
        "mime_type": file.content_type,
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": current_user.get("user_id") or current_user.get("mobile_number"),
        "status": "active"
    }
    
    await db.files.insert_one(file_doc)
    
    # Update vehicle documents
    document_field_map = {
        "rc": "registration_certificate",
        "insurance": "insurance",
        "pollution": "pollution_certificate",
        "fitness": "fitness_certificate",
        "permit": "permit",
        "road_tax": "road_tax_receipt"
    }
    
    field_name = document_field_map.get(document_type)
    update_data = {
        f"documents.{field_name}": file_id,
        "updated_at": datetime.utcnow()
    }
    
    # Update expiry date if provided
    if expiry_date:
        try:
            expiry_dt = datetime.strptime(expiry_date, "%Y-%m-%d")
            if document_type == "rc":
                update_data["registration_expiry"] = expiry_dt
            elif document_type == "insurance":
                update_data["insurance_expiry"] = expiry_dt
            elif document_type == "pollution":
                update_data["pollution_expiry"] = expiry_dt
            elif document_type == "fitness":
                update_data["fitness_expiry"] = expiry_dt
            elif document_type == "permit":
                update_data["permit_expiry"] = expiry_dt
        except ValueError:
            pass  # Invalid date format, skip
    
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {"$set": update_data}
    )
    
    return {
        "message": f"{document_type.upper()} document uploaded successfully",
        "file_id": file_id,
        "file_path": str(file_path),
        "document_type": document_type
    }


@router.post("/{vehicle_id}/photos/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_vehicle_photo(
    vehicle_id: str,
    photo_type: str = Form(..., description="front, back, left, right, interior, rc_photo, insurance_sticker"),
    file: UploadFile = File(...),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Upload vehicle photo
    
    Photo types:
    - front: Front view (MANDATORY)
    - back: Back view (MANDATORY)
    - left: Left side view
    - right: Right side view
    - interior: Interior/Dashboard
    - rc_photo: Physical RC book photo
    - insurance_sticker: Insurance sticker on windshield
    
    Permissions: Admin, Super Admin only
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    # Validate photo type
    valid_types = ["front", "back", "left", "right", "interior", "rc_photo", "insurance_sticker"]
    if photo_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid photo_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate file type (images only)
    allowed_extensions = ["jpg", "jpeg", "png"]
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (max 2MB for photos)
    file_content = await file.read()
    file_size = len(file_content)
    max_size = 2 * 1024 * 1024  # 2MB
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Photo too large. Maximum size: 2MB"
        )
    
    # Save file
    import uuid
    from pathlib import Path
    
    upload_dir = Path(f"uploads/vehicles/{vehicle_id}/photos")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_path = upload_dir / f"{photo_type}_{file_id}.{file_ext}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create file record
    file_doc = {
        "file_id": file_id,
        "vehicle_id": vehicle_id,
        "file_type": f"vehicle_photo_{photo_type}",
        "photo_type": photo_type,
        "file_path": str(file_path),
        "original_filename": file.filename,
        "file_size": file_size,
        "mime_type": file.content_type,
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": current_user.get("user_id") or current_user.get("mobile_number"),
        "status": "active"
    }
    
    await db.files.insert_one(file_doc)
    
    # Update vehicle photos
    photo_field_map = {
        "front": "front_view",
        "back": "back_view",
        "left": "left_side",
        "right": "right_side",
        "interior": "interior",
        "rc_photo": "rc_photo",
        "insurance_sticker": "insurance_sticker"
    }
    
    field_name = photo_field_map.get(photo_type)
    
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {
            "$set": {
                f"photos.{field_name}": file_id,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"{photo_type.upper()} photo uploaded successfully",
        "file_id": file_id,
        "file_path": str(file_path),
        "photo_type": photo_type
    }


@router.get("/{vehicle_id}/documents", response_model=dict)
async def get_vehicle_documents(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all documents for a vehicle
    
    Returns file IDs and expiry dates for:
    - RC, Insurance, Pollution, Fitness, Permit, Road Tax
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    documents = vehicle.get("documents", {})
    
    # Get file details for each document
    document_details = {}
    for doc_type, file_id in documents.items():
        if file_id:
            file_record = await db.files.find_one({"file_id": file_id})
            if file_record:
                file_record["_id"] = str(file_record["_id"])
                document_details[doc_type] = file_record
    
    # Get expiry dates
    expiry_dates = {
        "registration_expiry": vehicle.get("registration_expiry"),
        "insurance_expiry": vehicle.get("insurance_expiry"),
        "pollution_expiry": vehicle.get("pollution_expiry"),
        "fitness_expiry": vehicle.get("fitness_expiry"),
        "permit_expiry": vehicle.get("permit_expiry")
    }
    
    # Check for expiring documents (next 30 days)
    alerts = []
    thirty_days = datetime.utcnow() + timedelta(days=30)
    
    for doc_name, expiry in expiry_dates.items():
        if expiry and datetime.utcnow() <= expiry <= thirty_days:
            days_until = (expiry - datetime.utcnow()).days
            alerts.append({
                "document": doc_name.replace("_expiry", ""),
                "expiry_date": expiry,
                "days_until_expiry": days_until,
                "severity": "critical" if days_until <= 7 else "warning"
            })
    
    return {
        "vehicle_id": vehicle_id,
        "documents": document_details,
        "expiry_dates": expiry_dates,
        "alerts": alerts
    }


@router.get("/{vehicle_id}/photos", response_model=dict)
async def get_vehicle_photos(
    vehicle_id: str,
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all photos for a vehicle
    
    Returns file IDs for:
    - Front, Back, Left, Right, Interior, RC Photo, Insurance Sticker
    """
    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found"
        )
    
    photos = vehicle.get("photos", {})
    
    # Get file details for each photo
    photo_details = {}
    for photo_type, file_id in photos.items():
        if file_id:
            file_record = await db.files.find_one({"file_id": file_id})
            if file_record:
                file_record["_id"] = str(file_record["_id"])
                photo_details[photo_type] = file_record
    
    # Check which mandatory photos are missing
    mandatory_photos = ["front_view", "back_view"]
    missing_mandatory = [p for p in mandatory_photos if not photos.get(p)]
    
    return {
        "vehicle_id": vehicle_id,
        "photos": photo_details,
        "missing_mandatory": missing_mandatory,
        "is_complete": len(missing_mandatory) == 0
    }


@router.get("/documents/expiring", response_model=dict)
async def get_expiring_documents(
    days: int = Query(30, ge=1, le=365, description="Days ahead to check"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all vehicles with documents expiring soon (fleet-wide)
    
    Critical for compliance and operations
    """
    end_date = datetime.utcnow() + timedelta(days=days)
    
    # Find vehicles with expiring insurance (most critical)
    cursor = db.vehicles.find({
        "insurance_expiry": {
            "$gte": datetime.utcnow(),
            "$lte": end_date
        }
    }).sort("insurance_expiry", 1)
    
    vehicles = await cursor.to_list(length=100)
    
    expiring_list = []
    for vehicle in vehicles:
        insurance_expiry = vehicle.get("insurance_expiry")
        if insurance_expiry:
            days_until = (insurance_expiry - datetime.utcnow()).days
            expiring_list.append({
                "vehicle_id": vehicle.get("vehicle_id"),
                "registration_number": vehicle.get("registration_number"),
                "make": vehicle.get("make"),
                "model": vehicle.get("model"),
                "document_type": "insurance",
                "expiry_date": insurance_expiry,
                "days_until_expiry": days_until,
                "severity": "critical" if days_until <= 7 else "warning" if days_until <= 15 else "info"
            })
    
    # Sort by days until expiry
    expiring_list.sort(key=lambda x: x["days_until_expiry"])
    
    return {
        "period_days": days,
        "total": len(expiring_list),
        "expiring_documents": expiring_list
    }


# ============================================================================
# ANALYTICS & REPORTING ENDPOINTS
# ============================================================================

@router.get("/analytics/dashboard", response_model=dict)
async def get_fleet_dashboard_analytics(
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get comprehensive fleet dashboard analytics
    
    Returns everything needed for admin dashboard:
    - Fleet overview (counts by status, fuel type)
    - Recent activity
    - Alerts (expiring docs, overdue maintenance, low battery)
    - Cost summary (this month)
    - Top performing/problematic vehicles
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Fleet Overview
    total_vehicles = await db.vehicles.count_documents({})
    available = await db.vehicles.count_documents({"status": VehicleStatus.AVAILABLE})
    in_use = await db.vehicles.count_documents({"status": VehicleStatus.IN_USE})
    maintenance = await db.vehicles.count_documents({"status": VehicleStatus.MAINTENANCE})
    charging = await db.vehicles.count_documents({"status": VehicleStatus.CHARGING})
    
    electric_vehicles = await db.vehicles.count_documents({"is_electric": True})
    fuel_vehicles = await db.vehicles.count_documents({"is_electric": False})
    
    # Alerts
    thirty_days = datetime.utcnow() + timedelta(days=30)
    
    insurance_expiring = await db.vehicles.count_documents({
        "insurance_expiry": {"$lte": thirty_days, "$gte": datetime.utcnow()}
    })
    
    insurance_expired = await db.vehicles.count_documents({
        "insurance_expiry": {"$lt": datetime.utcnow()}
    })
    
    overdue_maintenance = await db.vehicle_maintenance.count_documents({
        "status": MaintenanceStatus.SCHEDULED,
        "scheduled_date": {"$lt": datetime.utcnow()}
    })
    
    low_battery_evs = await db.vehicles.count_documents({
        "is_electric": True,
        "ev_details.current_battery_level": {"$lt": 20}
    })
    
    # Recent Activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_vehicles = await db.vehicles.count_documents({"created_at": {"$gte": seven_days_ago}})
    recent_assignments = await db.vehicle_assignments.count_documents({"created_at": {"$gte": seven_days_ago}})
    recent_charging = await db.charging_sessions.count_documents({"started_at": {"$gte": seven_days_ago}})
    recent_maintenance = await db.vehicle_maintenance.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    # This Month Costs
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    expense_cursor = db.vehicle_expenses.find({"date": {"$gte": month_start}})
    expenses = await expense_cursor.to_list(length=10000)
    
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    fuel_expenses = sum(e.get("amount", 0) for e in expenses if e.get("expense_type") == ExpenseType.FUEL)
    charging_expenses = sum(e.get("amount", 0) for e in expenses if e.get("expense_type") == ExpenseType.CHARGING)
    maintenance_expenses = sum(e.get("amount", 0) for e in expenses if e.get("expense_type") == ExpenseType.MAINTENANCE)
    
    return {
        "fleet_overview": {
            "total_vehicles": total_vehicles,
            "by_status": {
                "available": available,
                "in_use": in_use,
                "maintenance": maintenance,
                "charging": charging
            },
            "by_fuel_type": {
                "electric": electric_vehicles,
                "fuel": fuel_vehicles
            }
        },
        "alerts": {
            "insurance_expiring_soon": insurance_expiring,
            "insurance_expired": insurance_expired,
            "overdue_maintenance": overdue_maintenance,
            "low_battery_evs": low_battery_evs,
            "total_alerts": insurance_expiring + insurance_expired + overdue_maintenance + low_battery_evs
        },
        "recent_activity": {
            "new_vehicles": recent_vehicles,
            "new_assignments": recent_assignments,
            "charging_sessions": recent_charging,
            "maintenance_scheduled": recent_maintenance
        },
        "costs_this_month": {
            "total": round(total_expenses, 2),
            "fuel": round(fuel_expenses, 2),
            "charging": round(charging_expenses, 2),
            "maintenance": round(maintenance_expenses, 2)
        }
    }


@router.get("/analytics/utilization", response_model=dict)
async def get_fleet_utilization_analytics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get fleet utilization analytics
    
    Returns:
    - Vehicles by utilization (high, medium, low)
    - Average utilization rate
    - Idle vehicles
    - Most/least used vehicles
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all vehicles
    all_vehicles = await db.vehicles.find({}).to_list(length=1000)
    
    utilization_data = []
    
    for vehicle in all_vehicles:
        vehicle_id = vehicle.get("vehicle_id")
        
        # Count trips in period
        trip_count = await db.trips.count_documents({
            "vehicle_id": vehicle_id,
            "date": {"$gte": start_date.strftime("%Y-%m-%d")}
        })
        
        # Count days assigned (active assignment)
        assignments = await db.vehicle_assignments.find({
            "vehicle_id": vehicle_id,
            "assigned_at": {"$lte": datetime.utcnow()},
            "$or": [
                {"returned_at": {"$gte": start_date}},
                {"returned_at": None}
            ]
        }).to_list(length=100)
        
        days_assigned = 0
        for assignment in assignments:
            assigned_at = max(assignment.get("assigned_at"), start_date)
            returned_at = assignment.get("returned_at") or datetime.utcnow()
            days_assigned += (returned_at - assigned_at).days
        
        # Calculate utilization percentage
        utilization_pct = min(100, (days_assigned / days) * 100)
        
        # Categorize
        if utilization_pct >= 70:
            category = "high"
        elif utilization_pct >= 30:
            category = "medium"
        else:
            category = "low"
        
        utilization_data.append({
            "vehicle_id": vehicle_id,
            "registration_number": vehicle.get("registration_number"),
            "make": vehicle.get("make"),
            "model": vehicle.get("model"),
            "trip_count": trip_count,
            "days_assigned": days_assigned,
            "utilization_percentage": round(utilization_pct, 2),
            "category": category
        })
    
    # Sort by utilization
    utilization_data.sort(key=lambda x: x["utilization_percentage"], reverse=True)
    
    # Calculate averages
    avg_utilization = sum(v["utilization_percentage"] for v in utilization_data) / len(utilization_data) if utilization_data else 0
    
    # Categorize
    high_utilization = [v for v in utilization_data if v["category"] == "high"]
    medium_utilization = [v for v in utilization_data if v["category"] == "medium"]
    low_utilization = [v for v in utilization_data if v["category"] == "low"]
    
    return {
        "period_days": days,
        "total_vehicles": len(utilization_data),
        "average_utilization": round(avg_utilization, 2),
        "by_category": {
            "high": len(high_utilization),
            "medium": len(medium_utilization),
            "low": len(low_utilization)
        },
        "top_5_most_used": utilization_data[:5],
        "top_5_least_used": utilization_data[-5:],
        "all_vehicles": utilization_data
    }


@router.get("/analytics/ev-fleet", response_model=dict)
async def get_ev_fleet_analytics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get Electric Vehicle fleet analytics
    
    Returns:
    - Total EVs in fleet
    - Average battery health
    - Total charging costs vs equivalent fuel costs
    - Most efficient EVs
    - Charging patterns
    - Savings analysis
    
    Permissions: Admin, Super Admin, Manager, Accountant
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager", "accountant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get all electric vehicles
    ev_cursor = db.vehicles.find({"is_electric": True})
    evs = await ev_cursor.to_list(length=1000)
    
    if not evs:
        return {
            "message": "No electric vehicles in fleet",
            "total_evs": 0,
            "analytics": None
        }
    
    # Calculate fleet-wide metrics
    total_evs = len(evs)
    avg_battery_health = sum(v.get("ev_details", {}).get("battery_health", 100) for v in evs) / total_evs
    avg_battery_level = sum(v.get("ev_details", {}).get("current_battery_level", 0) for v in evs) / total_evs
    total_charging_cycles = sum(v.get("ev_details", {}).get("charging_cycles", 0) for v in evs)
    
    # Count by status
    evs_available = sum(1 for v in evs if v.get("status") == VehicleStatus.AVAILABLE)
    evs_in_use = sum(1 for v in evs if v.get("status") == VehicleStatus.IN_USE)
    evs_charging = sum(1 for v in evs if v.get("status") == VehicleStatus.CHARGING)
    evs_low_battery = sum(1 for v in evs if v.get("ev_details", {}).get("current_battery_level", 100) < 20)
    
    # Get charging costs (last N days)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    charging_expenses_cursor = db.vehicle_expenses.find({
        "expense_type": ExpenseType.CHARGING,
        "date": {"$gte": start_date}
    })
    charging_expenses = await charging_expenses_cursor.to_list(length=10000)
    
    total_charging_cost = sum(e.get("amount", 0) for e in charging_expenses)
    total_kwh = sum(e.get("kw_consumed", 0) for e in charging_expenses if e.get("kw_consumed"))
    avg_cost_per_kwh = (total_charging_cost / total_kwh) if total_kwh > 0 else 0
    
    # Estimate equivalent fuel cost
    # Rough calculation: 1 liter diesel ≈ 10 kWh energy, avg diesel price ≈ ₹100/liter
    equivalent_fuel_liters = total_kwh / 10
    equivalent_fuel_cost = equivalent_fuel_liters * 100  # Assuming ₹100/liter
    savings = equivalent_fuel_cost - total_charging_cost
    
    # Get top 5 most efficient EVs (by kWh/100km)
    ev_efficiency = []
    for ev in evs:
        ev_id = ev.get("vehicle_id")
        consumption = ev.get("ev_details", {}).get("avg_consumption", 0)
        if consumption > 0:
            ev_efficiency.append({
                "vehicle_id": ev_id,
                "registration_number": ev.get("registration_number"),
                "make": ev.get("make"),
                "model": ev.get("model"),
                "avg_consumption_kwh_per_100km": consumption,
                "battery_health": ev.get("ev_details", {}).get("battery_health", 100)
            })
    
    ev_efficiency.sort(key=lambda x: x["avg_consumption_kwh_per_100km"])
    
    return {
        "period_days": days,
        "fleet_overview": {
            "total_evs": total_evs,
            "available": evs_available,
            "in_use": evs_in_use,
            "charging": evs_charging,
            "low_battery": evs_low_battery
        },
        "battery_metrics": {
            "avg_battery_health": round(avg_battery_health, 2),
            "avg_battery_level": round(avg_battery_level, 2),
            "total_charging_cycles": total_charging_cycles
        },
        "cost_analysis": {
            "total_charging_cost": round(total_charging_cost, 2),
            "total_kwh_consumed": round(total_kwh, 2),
            "avg_cost_per_kwh": round(avg_cost_per_kwh, 2),
            "equivalent_fuel_cost": round(equivalent_fuel_cost, 2),
            "savings": round(savings, 2),
            "savings_percentage": round((savings / equivalent_fuel_cost * 100), 2) if equivalent_fuel_cost > 0 else 0
        },
        "top_5_efficient_evs": ev_efficiency[:5]
    }


@router.get("/analytics/cost-report", response_model=dict)
async def get_fleet_cost_report(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    group_by: str = Query("type", description="Group by: type, vehicle, month"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get comprehensive cost report for the fleet
    
    Returns expenses grouped by type, vehicle, or month
    
    Permissions: Admin, Super Admin, Manager, Accountant
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager", "accountant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all expenses in period
    cursor = db.vehicle_expenses.find({"date": {"$gte": start_date}})
    expenses = await cursor.to_list(length=10000)
    
    total_cost = sum(e.get("amount", 0) for e in expenses)
    
    report = {
        "period_days": days,
        "total_expenses": len(expenses),
        "total_cost": round(total_cost, 2),
        "data": {}
    }
    
    if group_by == "type":
        # Group by expense type
        by_type = {}
        for expense in expenses:
            exp_type = expense.get("expense_type")
            if exp_type not in by_type:
                by_type[exp_type] = {"count": 0, "total": 0}
            by_type[exp_type]["count"] += 1
            by_type[exp_type]["total"] += expense.get("amount", 0)
        
        report["data"] = {
            k: {
                "count": v["count"],
                "total": round(v["total"], 2),
                "percentage": round((v["total"] / total_cost * 100), 2) if total_cost > 0 else 0
            }
            for k, v in by_type.items()
        }
    
    elif group_by == "vehicle":
        # Group by vehicle
        by_vehicle = {}
        for expense in expenses:
            vehicle_id = expense.get("vehicle_id")
            if vehicle_id not in by_vehicle:
                by_vehicle[vehicle_id] = {"count": 0, "total": 0}
            by_vehicle[vehicle_id]["count"] += 1
            by_vehicle[vehicle_id]["total"] += expense.get("amount", 0)
        
        # Get vehicle details
        for vehicle_id in by_vehicle.keys():
            vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
            if vehicle:
                by_vehicle[vehicle_id]["registration"] = vehicle.get("registration_number")
                by_vehicle[vehicle_id]["make"] = vehicle.get("make")
                by_vehicle[vehicle_id]["model"] = vehicle.get("model")
        
        report["data"] = {
            k: {
                **v,
                "total": round(v["total"], 2),
                "percentage": round((v["total"] / total_cost * 100), 2) if total_cost > 0 else 0
            }
            for k, v in by_vehicle.items()
        }
    
    elif group_by == "month":
        # Group by month
        by_month = {}
        for expense in expenses:
            exp_date = expense.get("date")
            if exp_date:
                month_key = exp_date.strftime("%Y-%m")
                if month_key not in by_month:
                    by_month[month_key] = {"count": 0, "total": 0}
                by_month[month_key]["count"] += 1
                by_month[month_key]["total"] += expense.get("amount", 0)
        
        report["data"] = {
            k: {
                "count": v["count"],
                "total": round(v["total"], 2)
            }
            for k, v in sorted(by_month.items())
        }
    
    return report


@router.get("/analytics/performance", response_model=dict)
async def get_fleet_performance_report(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get fleet performance report
    
    Returns:
    - Vehicles ranked by various metrics
    - Most cost-efficient vehicles
    - Vehicles with most trips
    - Vehicles with issues (frequent maintenance, poor battery health)
    
    Permissions: Admin, Super Admin, Manager
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all vehicles
    all_vehicles = await db.vehicles.find({}).to_list(length=1000)
    
    vehicle_performance = []
    
    for vehicle in all_vehicles:
        vehicle_id = vehicle.get("vehicle_id")
        is_electric = vehicle.get("is_electric", False)
        
        # Count trips
        trip_count = await db.trips.count_documents({
            "vehicle_id": vehicle_id,
            "date": {"$gte": start_date.strftime("%Y-%m-%d")}
        })
        
        # Get total expenses
        expense_cursor = db.vehicle_expenses.find({
            "vehicle_id": vehicle_id,
            "date": {"$gte": start_date}
        })
        expenses = await expense_cursor.to_list(length=1000)
        total_cost = sum(e.get("amount", 0) for e in expenses)
        
        # Get total kilometers from trips
        trip_cursor = db.trips.find({
            "vehicle_id": vehicle_id,
            "date": {"$gte": start_date.strftime("%Y-%m-%d")}
        })
        trips = await trip_cursor.to_list(length=1000)
        total_km = sum(t.get("total_kilometers", 0) for t in trips)
        
        # Calculate cost per km
        cost_per_km = (total_cost / total_km) if total_km > 0 else 0
        
        # Count maintenance
        maintenance_count = await db.vehicle_maintenance.count_documents({
            "vehicle_id": vehicle_id,
            "created_at": {"$gte": start_date}
        })
        
        # Issues
        issues = []
        if maintenance_count > 5:
            issues.append("frequent_maintenance")
        if is_electric:
            battery_health = vehicle.get("ev_details", {}).get("battery_health", 100)
            if battery_health < 80:
                issues.append("poor_battery_health")
        
        vehicle_performance.append({
            "vehicle_id": vehicle_id,
            "registration_number": vehicle.get("registration_number"),
            "make": vehicle.get("make"),
            "model": vehicle.get("model"),
            "is_electric": is_electric,
            "metrics": {
                "trip_count": trip_count,
                "total_cost": round(total_cost, 2),
                "total_km": round(total_km, 2),
                "cost_per_km": round(cost_per_km, 2),
                "maintenance_count": maintenance_count
            },
            "issues": issues,
            "status": vehicle.get("status")
        })
    
    # Sort by cost efficiency (lower cost per km is better)
    most_efficient = sorted(
        [v for v in vehicle_performance if v["metrics"]["cost_per_km"] > 0],
        key=lambda x: x["metrics"]["cost_per_km"]
    )[:10]
    
    # Most trips
    most_active = sorted(
        vehicle_performance,
        key=lambda x: x["metrics"]["trip_count"],
        reverse=True
    )[:10]
    
    # Vehicles with issues
    problematic = [v for v in vehicle_performance if v["issues"]]
    
    return {
        "period_days": days,
        "total_vehicles": len(vehicle_performance),
        "most_efficient": most_efficient,
        "most_active": most_active,
        "problematic_vehicles": problematic,
        "all_vehicles": vehicle_performance
    }


@router.get("/analytics/export", response_model=dict)
async def export_fleet_data(
    report_type: str = Query(..., description="vehicles, expenses, maintenance, charging"),
    format: str = Query("json", description="json or csv"),
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Export fleet data for reporting and analysis
    
    Report types:
    - vehicles: All vehicle data
    - expenses: All expenses
    - maintenance: Maintenance records
    - charging: Charging sessions (EV only)
    
    Format: json or csv
    
    Permissions: Admin, Super Admin, Manager, Accountant
    """
    # Check permissions
    if current_user.get("role") not in ["admin", "super_admin", "manager", "accountant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    data = []
    
    if report_type == "vehicles":
        cursor = db.vehicles.find({})
        vehicles = await cursor.to_list(length=1000)
        for v in vehicles:
            v["_id"] = str(v["_id"])
            data.append(v)
    
    elif report_type == "expenses":
        cursor = db.vehicle_expenses.find({"date": {"$gte": start_date}})
        expenses = await cursor.to_list(length=10000)
        for e in expenses:
            e["_id"] = str(e["_id"])
            data.append(e)
    
    elif report_type == "maintenance":
        cursor = db.vehicle_maintenance.find({"created_at": {"$gte": start_date}})
        maintenance = await cursor.to_list(length=10000)
        for m in maintenance:
            m["_id"] = str(m["_id"])
            data.append(m)
    
    elif report_type == "charging":
        cursor = db.charging_sessions.find({"started_at": {"$gte": start_date}})
        sessions = await cursor.to_list(length=10000)
        for s in sessions:
            s["_id"] = str(s["_id"])
            data.append(s)
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report_type. Must be: vehicles, expenses, maintenance, or charging"
        )
    
    # TODO: Implement CSV conversion if format == "csv"
    # For now, return JSON
    
    return {
        "report_type": report_type,
        "format": format,
        "period_days": days,
        "total_records": len(data),
        "data": data,
        "generated_at": datetime.utcnow().isoformat()
    }

