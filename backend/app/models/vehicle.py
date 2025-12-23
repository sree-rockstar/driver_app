from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

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


class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    CHARGING = "charging"
    INACTIVE = "inactive"


class VehicleCondition(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    NEEDS_REPAIR = "needs_repair"


class FuelType(str, Enum):
    PETROL = "petrol"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    CNG = "cng"
    HYBRID = "hybrid"


class OwnershipType(str, Enum):
    OWNED = "owned"
    LEASED = "leased"
    RENTAL = "rental"


class VehicleDocuments(BaseModel):
    registration_certificate: Optional[str] = None  # File ID
    insurance: Optional[str] = None
    pollution_certificate: Optional[str] = None
    fitness_certificate: Optional[str] = None
    permit: Optional[str] = None
    road_tax_receipt: Optional[str] = None


class VehiclePhotos(BaseModel):
    front_view: Optional[str] = None  # File ID
    back_view: Optional[str] = None
    left_side: Optional[str] = None
    right_side: Optional[str] = None
    interior: Optional[str] = None
    rc_photo: Optional[str] = None
    insurance_sticker: Optional[str] = None


class EVDetails(BaseModel):
    battery_capacity: float = Field(..., description="Battery capacity in kWh")
    current_battery_level: float = Field(default=100, ge=0, le=100)
    estimated_range: float = Field(..., description="Range in km on full charge")
    current_range: float = Field(..., description="Current range in km")
    charging_type: str = Field(default="AC+DC")  # AC, DC, AC+DC
    max_charging_speed: float = Field(..., description="Max charging speed in kW")
    last_charged_at: Optional[datetime] = None
    charging_status: str = Field(default="not_charging")  # charging, not_charging, fully_charged
    battery_health: float = Field(default=100, ge=0, le=100)
    charging_cycles: int = Field(default=0)
    home_charging_available: bool = Field(default=False)


class VehicleBase(BaseModel):
    vehicle_id: str = Field(..., description="Unique vehicle identifier")
    
    # Basic Information
    registration_number: str = Field(..., description="License plate number")
    make: str = Field(..., description="Manufacturer")
    model: str = Field(..., description="Model name")
    year: int = Field(..., ge=1900, le=2100)
    color: str
    
    # Classification
    vehicle_type: str = Field(..., description="SUV, Sedan, Hatchback, etc.")
    seating_capacity: int = Field(..., ge=1, le=50)
    fuel_type: FuelType
    is_electric: bool = Field(default=False)
    
    # EV Details (only if is_electric = True)
    ev_details: Optional[EVDetails] = None
    
    # Status
    status: VehicleStatus = Field(default=VehicleStatus.AVAILABLE)
    condition: VehicleCondition = Field(default=VehicleCondition.EXCELLENT)
    
    # Current Assignment
    current_driver_id: Optional[str] = None
    current_trip_id: Optional[str] = None
    
    # Metrics
    odometer_reading: float = Field(..., description="Current km reading")
    last_service_km: Optional[float] = None
    next_service_km: Optional[float] = None
    
    # Documents
    documents: VehicleDocuments = Field(default_factory=VehicleDocuments)
    photos: VehiclePhotos = Field(default_factory=VehiclePhotos)
    
    # Document Expiry Dates
    registration_expiry: Optional[datetime] = None
    insurance_expiry: Optional[datetime] = None
    pollution_expiry: Optional[datetime] = None
    fitness_expiry: Optional[datetime] = None
    permit_expiry: Optional[datetime] = None
    
    # Ownership
    ownership_type: OwnershipType = Field(default=OwnershipType.OWNED)
    acquisition_date: Optional[datetime] = None
    purchase_price: Optional[float] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    registration_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    vehicle_type: Optional[str] = None
    seating_capacity: Optional[int] = None
    fuel_type: Optional[FuelType] = None
    is_electric: Optional[bool] = None
    ev_details: Optional[EVDetails] = None
    status: Optional[VehicleStatus] = None
    condition: Optional[VehicleCondition] = None
    current_driver_id: Optional[str] = None
    current_trip_id: Optional[str] = None
    odometer_reading: Optional[float] = None
    last_service_km: Optional[float] = None
    next_service_km: Optional[float] = None
    documents: Optional[VehicleDocuments] = None
    photos: Optional[VehiclePhotos] = None
    registration_expiry: Optional[datetime] = None
    insurance_expiry: Optional[datetime] = None
    pollution_expiry: Optional[datetime] = None
    fitness_expiry: Optional[datetime] = None
    permit_expiry: Optional[datetime] = None
    ownership_type: Optional[OwnershipType] = None


class VehicleInDB(VehicleBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Vehicle(VehicleInDB):
    pass

