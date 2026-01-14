from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class TripBase(BaseModel):
    trip_id: str = Field(..., description="Unique trip identifier (e.g., MS001)")
    site: str = Field(default="Microsoft", description="Work site name")
    date: str = Field(..., description="Trip date in YYYY-MM-DD format")
    start_time: str = Field(..., description="Start time in 24-hour format HH:MM (e.g., 09:00, 17:30)")
    expected_completion_time: Optional[str] = Field(None, description="Expected completion time in 24-hour format HH:MM")
    completion_time: str = Field(..., description="Actual completion time in 24-hour format HH:MM")
    source_point: str = Field(..., description="Starting location")
    destination: str = Field(..., description="Destination location")
    total_kilometers: float = Field(..., gt=0, description="Total distance in kilometers")
    
    # NEW: Trip Sheet Fields
    trip_type: Optional[str] = Field(None, description="Type of trip (e.g., Quick Ride, Ola, Uber)")
    amount: Optional[float] = Field(None, ge=0, description="Trip amount/cost")
    payment_method: Optional[str] = Field(None, description="Payment method (e.g., Cash, Credit, UPI)")
    expenses: Optional[float] = Field(None, ge=0, description="Trip expenses (fuel, tolls, etc.)")
    
    # NEW: Fleet Management Integration
    vehicle_id: Optional[str] = Field(None, description="Vehicle used for this trip")
    odometer_start: Optional[float] = Field(None, ge=0, description="Odometer reading at trip start")
    odometer_end: Optional[float] = Field(None, ge=0, description="Odometer reading at trip end")
    
    # For Fuel Vehicles
    fuel_consumed: Optional[float] = Field(None, gt=0, description="Fuel consumed in liters")
    
    # For Electric Vehicles
    battery_level_start: Optional[float] = Field(None, ge=0, le=100, description="Battery % at trip start")
    battery_level_end: Optional[float] = Field(None, ge=0, le=100, description="Battery % at trip end")
    battery_consumed: Optional[float] = Field(None, ge=0, le=100, description="Battery % used in trip")
    energy_consumed: Optional[float] = Field(None, gt=0, description="Energy consumed in kWh")
    charging_stops: Optional[int] = Field(0, ge=0, description="Number of charging stops during trip")
    charging_session_ids: Optional[List[str]] = Field(default_factory=list, description="IDs of charging sessions during trip")


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    trip_id: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    expected_completion_time: Optional[str] = None
    completion_time: Optional[str] = None
    source_point: Optional[str] = None
    destination: Optional[str] = None
    total_kilometers: Optional[float] = None
    
    # Trip Sheet fields
    trip_type: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    payment_method: Optional[str] = None
    expenses: Optional[float] = Field(None, ge=0)
    
    # Fleet Management fields
    vehicle_id: Optional[str] = None
    odometer_start: Optional[float] = Field(None, ge=0)
    odometer_end: Optional[float] = Field(None, ge=0)
    fuel_consumed: Optional[float] = Field(None, gt=0)
    battery_level_start: Optional[float] = Field(None, ge=0, le=100)
    battery_level_end: Optional[float] = Field(None, ge=0, le=100)
    battery_consumed: Optional[float] = Field(None, ge=0, le=100)
    energy_consumed: Optional[float] = Field(None, gt=0)
    charging_stops: Optional[int] = Field(None, ge=0)
    charging_session_ids: Optional[List[str]] = None


class TripInDB(TripBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="ID of the driver who created the trip")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Trip(TripInDB):
    pass

