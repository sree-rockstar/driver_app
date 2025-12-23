from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class DriverStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


class LocationBase(BaseModel):
    latitude: float
    longitude: float


class DriverBase(BaseModel):
    user_id: str
    license_number: str
    
    # DEPRECATED: These fields are kept for backward compatibility
    # Use assigned_vehicle_id instead (links to vehicles collection)
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    
    # NEW: Fleet Management Integration
    assigned_vehicle_id: Optional[str] = Field(
        None, 
        description="Current assigned vehicle ID (links to vehicles collection)"
    )
    vehicle_assignment_type: Optional[str] = Field(
        None,
        description="Assignment type: permanent, temporary, or None if no vehicle assigned"
    )
    migrated_to_fleet: bool = Field(
        default=False,
        description="Flag indicating if driver's vehicle data was migrated to fleet system"
    )
    
    # Driver Status
    status: DriverStatus = DriverStatus.OFFLINE
    current_location: Optional[LocationBase] = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    license_number: Optional[str] = None
    
    # DEPRECATED: For backward compatibility only
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    
    # NEW: Fleet Management
    assigned_vehicle_id: Optional[str] = None
    vehicle_assignment_type: Optional[str] = None
    
    # Status
    status: Optional[DriverStatus] = None
    current_location: Optional[LocationBase] = None


class Driver(DriverBase):
    id: str
    created_at: datetime
    updated_at: datetime
    rating: float = 0.0
    total_trips: int = 0

    class Config:
        from_attributes = True


