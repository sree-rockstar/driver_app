from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

from .vehicle import PyObjectId


class AssignmentType(str, Enum):
    PERMANENT = "permanent"
    TEMPORARY = "temporary"
    TRIP_SPECIFIC = "trip_specific"


class AssignmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AssignmentBase(BaseModel):
    vehicle_id: str
    driver_id: str
    
    # Assignment Details
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_until: Optional[datetime] = None  # None = indefinite
    assignment_type: AssignmentType = Field(default=AssignmentType.PERMANENT)
    
    # Trip Association (if trip-specific)
    trip_id: Optional[str] = None
    
    # Condition at Assignment
    odometer_at_assignment: float
    condition_at_assignment: str
    
    # Return Information
    returned_at: Optional[datetime] = None
    odometer_at_return: Optional[float] = None
    condition_at_return: Optional[str] = None
    return_notes: Optional[str] = None
    
    # Status
    status: AssignmentStatus = Field(default=AssignmentStatus.ACTIVE)


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    assigned_until: Optional[datetime] = None
    trip_id: Optional[str] = None
    returned_at: Optional[datetime] = None
    odometer_at_return: Optional[float] = None
    condition_at_return: Optional[str] = None
    return_notes: Optional[str] = None
    status: Optional[AssignmentStatus] = None


class AssignmentInDB(AssignmentBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Assignment(AssignmentInDB):
    pass

