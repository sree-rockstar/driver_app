from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

from .vehicle import PyObjectId


class ChargingType(str, Enum):
    AC_SLOW = "ac_slow"
    AC_FAST = "ac_fast"
    DC_FAST = "dc_fast"
    HOME = "home"


class ChargingStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    INTERRUPTED = "interrupted"
    FAILED = "failed"


class ChargingSessionBase(BaseModel):
    vehicle_id: str
    
    # ===== REQUIRED FIELDS (User Input) =====
    
    # Battery State (SOC = State of Charge)
    start_soc: float = Field(..., ge=0, le=100, description="State of Charge at start (%)")
    end_soc: float = Field(..., ge=0, le=100, description="State of Charge at end (%)")
    
    # Energy & Cost
    kw_consumed: float = Field(..., gt=0, description="Energy consumed in kWh")
    amount: float = Field(..., gt=0, description="Total cost in rupees")
    
    # Charging Station
    charging_station_name: str = Field(..., description="Charging station name and location")
    
    # ===== AUTO-CALCULATED FIELDS =====
    soc_charged: Optional[float] = None  # end_soc - start_soc
    cost_per_kwh: Optional[float] = None  # amount / kw_consumed
    
    # ===== AUTO-CAPTURED FIELDS =====
    
    # Session Timing
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    
    # ===== OPTIONAL FIELDS =====
    charging_type: Optional[ChargingType] = None
    payment_method: Optional[str] = None  # cash, card, upi
    receipt_file_id: Optional[str] = None
    odometer_reading: Optional[float] = None
    notes: Optional[str] = None
    
    # Context
    driver_id: str
    trip_id: Optional[str] = None
    
    # Status
    status: ChargingStatus = Field(default=ChargingStatus.COMPLETED)


class ChargingSessionCreate(BaseModel):
    """
    Start a charging session - minimal data needed
    """
    vehicle_id: str
    driver_id: str
    started_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    status: ChargingStatus = Field(default=ChargingStatus.IN_PROGRESS)


class ChargingSessionComplete(BaseModel):
    """
    Complete a charging session - user enters 5 required fields
    """
    # REQUIRED: User must enter these 5 fields
    start_soc: float = Field(..., ge=0, le=100, description="Battery % at start")
    end_soc: float = Field(..., ge=0, le=100, description="Battery % at end")
    kw_consumed: float = Field(..., gt=0, description="kWh consumed")
    amount: float = Field(..., gt=0, description="Total cost paid")
    charging_station_name: str = Field(..., min_length=3, description="Station name and location")
    
    # OPTIONAL: Additional details
    charging_type: Optional[ChargingType] = None
    payment_method: Optional[str] = None
    receipt_file_id: Optional[str] = None
    odometer_reading: Optional[float] = None
    notes: Optional[str] = None
    trip_id: Optional[str] = None


class ChargingSessionUpdate(BaseModel):
    """
    Update a charging session
    """
    start_soc: Optional[float] = Field(None, ge=0, le=100)
    end_soc: Optional[float] = Field(None, ge=0, le=100)
    kw_consumed: Optional[float] = Field(None, gt=0)
    amount: Optional[float] = Field(None, gt=0)
    charging_station_name: Optional[str] = None
    charging_type: Optional[ChargingType] = None
    payment_method: Optional[str] = None
    receipt_file_id: Optional[str] = None
    odometer_reading: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[ChargingStatus] = None


class ChargingSessionInDB(ChargingSessionBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class ChargingSession(ChargingSessionInDB):
    pass


# Helper function to calculate auto-fields
def calculate_charging_metrics(session: ChargingSessionComplete) -> dict:
    """
    Calculate auto-calculated fields for a charging session
    
    Returns:
        dict with soc_charged and cost_per_kwh
    """
    soc_charged = session.end_soc - session.start_soc
    cost_per_kwh = round(session.amount / session.kw_consumed, 2)
    
    return {
        "soc_charged": round(soc_charged, 2),
        "cost_per_kwh": cost_per_kwh
    }

