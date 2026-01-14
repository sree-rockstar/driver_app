# Fleet Management System - Step-by-Step Implementation Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Week 1: Backend Foundation](#week-1-backend-foundation)
3. [Week 2: API Development](#week-2-api-development)
4. [Week 3: Basic Frontend](#week-3-basic-frontend)
5. [Week 4: Advanced Frontend & EV UI](#week-4-advanced-frontend--ev-ui)
6. [Week 5: Analytics & Reports](#week-5-analytics--reports)
7. [Week 6: Polish & Testing](#week-6-polish--testing)
8. [Deployment](#deployment)
9. [Post-Launch Checklist](#post-launch-checklist)

---

## Prerequisites

### Before You Start

**Environment Setup:**

- [ ] Python 3.10+ installed
- [ ] Node.js 16+ and npm installed
- [ ] MongoDB running (local or cloud)
- [ ] Git repository set up
- [ ] Code editor (VS Code recommended)
- [ ] Postman or similar for API testing

**Required Tools:**

```bash
# Check versions
python --version  # Should be 3.10+
node --version    # Should be 16+
npm --version
mongo --version   # Or check MongoDB Atlas connection
```

**Project Structure Check:**

```
driver_app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── models/
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

**Create a Feature Branch:**

```bash
cd /Users/sree/Documents/DriverApp/driver_app
git checkout -b feature/fleet-management
```

---

## Week 1: Backend Foundation

### Day 1: Database Models (Vehicles)

#### Step 1.1: Create Vehicle Model

**File:** `backend/app/models/vehicle.py`

```python
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
```

**Checkpoint 1.1:** ✅ Vehicle model created with EV support

---

#### Step 1.2: Create Vehicle Assignment Model

**File:** `backend/app/models/vehicle_assignment.py`

```python
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
```

**Checkpoint 1.2:** ✅ Assignment model created

---

### Day 2: EV-Specific Models

#### Step 1.3: Create Charging Session Model

**File:** `backend/app/models/charging_session.py`

```python
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

    # REQUIRED FIELDS (User Input)
    start_soc: float = Field(..., ge=0, le=100, description="State of Charge at start (%)")
    end_soc: float = Field(..., ge=0, le=100, description="State of Charge at end (%)")
    kw_consumed: float = Field(..., gt=0, description="Energy consumed in kWh")
    amount: float = Field(..., gt=0, description="Total cost in rupees")
    charging_station_name: str = Field(..., description="Charging station name and location")

    # AUTO-CALCULATED FIELDS
    soc_charged: Optional[float] = None  # end_soc - start_soc
    cost_per_kwh: Optional[float] = None  # amount / kw_consumed

    # AUTO-CAPTURED FIELDS
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    # OPTIONAL FIELDS
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
    vehicle_id: str
    driver_id: str
    # Start session - only need this
    started_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    status: ChargingStatus = Field(default=ChargingStatus.IN_PROGRESS)


class ChargingSessionComplete(BaseModel):
    # Complete session - user enters these 5 fields
    start_soc: float = Field(..., ge=0, le=100)
    end_soc: float = Field(..., ge=0, le=100)
    kw_consumed: float = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    charging_station_name: str

    # Optional fields
    charging_type: Optional[ChargingType] = None
    payment_method: Optional[str] = None
    receipt_file_id: Optional[str] = None
    odometer_reading: Optional[float] = None
    notes: Optional[str] = None


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
```

**Checkpoint 1.3:** ✅ Charging session model created

---

#### Step 1.4: Create Battery Health Model

**File:** `backend/app/models/battery_health.py`

```python
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

from .vehicle import PyObjectId


class BatteryHealthBase(BaseModel):
    vehicle_id: str

    # Health Metrics
    battery_health_percentage: float = Field(..., ge=0, le=100)
    total_charging_cycles: int = Field(default=0)
    actual_capacity: float = Field(..., description="Current capacity in kWh")
    original_capacity: float = Field(..., description="Original capacity in kWh")
    degradation_rate: float = Field(..., description="Degradation percentage")

    # Performance
    max_range_current: float = Field(..., description="Current max range in km")
    avg_consumption: float = Field(..., description="kWh per 100 km")

    # Temperature
    avg_battery_temp: Optional[float] = None
    max_battery_temp: Optional[float] = None

    # Recommendations
    needs_battery_service: bool = Field(default=False)
    estimated_replacement_date: Optional[datetime] = None

    # Measurement
    measured_at: datetime = Field(default_factory=datetime.utcnow)
    measured_by: str = Field(default="system")
    odometer_reading: float


class BatteryHealthCreate(BatteryHealthBase):
    pass


class BatteryHealthInDB(BatteryHealthBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class BatteryHealth(BatteryHealthInDB):
    pass
```

**Checkpoint 1.4:** ✅ Battery health model created

---

### Day 3: Maintenance & Expense Models

#### Step 1.5: Create Maintenance Model

**File:** `backend/app/models/vehicle_maintenance.py`

```python
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

from .vehicle import PyObjectId


class MaintenanceType(str, Enum):
    ROUTINE_SERVICE = "routine_service"
    REPAIR = "repair"
    INSPECTION = "inspection"
    CLEANING = "cleaning"
    TIRE_CHANGE = "tire_change"
    BATTERY_CHECK = "battery_check"
    OTHER = "other"


class MaintenanceStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceBase(BaseModel):
    vehicle_id: str

    # Maintenance Details
    maintenance_type: MaintenanceType
    description: str

    # Scheduling
    scheduled_date: datetime
    actual_date: Optional[datetime] = None

    # Status
    status: MaintenanceStatus = Field(default=MaintenanceStatus.SCHEDULED)

    # Details
    service_provider: Optional[str] = None
    cost: Optional[float] = None
    odometer_reading: Optional[float] = None

    # Parts & Work
    parts_replaced: Optional[List[str]] = None
    work_done: Optional[str] = None

    # Next Service
    next_service_km: Optional[float] = None
    next_service_date: Optional[datetime] = None

    # Documents
    invoice_file_id: Optional[str] = None

    # Downtime
    vehicle_unavailable_from: Optional[datetime] = None
    vehicle_unavailable_until: Optional[datetime] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    maintenance_type: Optional[MaintenanceType] = None
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    actual_date: Optional[datetime] = None
    status: Optional[MaintenanceStatus] = None
    service_provider: Optional[str] = None
    cost: Optional[float] = None
    odometer_reading: Optional[float] = None
    parts_replaced: Optional[List[str]] = None
    work_done: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[datetime] = None
    invoice_file_id: Optional[str] = None
    vehicle_unavailable_from: Optional[datetime] = None
    vehicle_unavailable_until: Optional[datetime] = None


class MaintenanceInDB(MaintenanceBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Maintenance(MaintenanceInDB):
    pass
```

**Checkpoint 1.5:** ✅ Maintenance model created

---

#### Step 1.6: Create Expense Model

**File:** `backend/app/models/vehicle_expense.py`

```python
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

from .vehicle import PyObjectId


class ExpenseType(str, Enum):
    FUEL = "fuel"
    CHARGING = "charging"
    MAINTENANCE = "maintenance"
    INSURANCE = "insurance"
    TAX = "tax"
    FINE = "fine"
    TOLL = "toll"
    PARKING = "parking"
    OTHER = "other"


class ExpenseBase(BaseModel):
    vehicle_id: str

    # Expense Details
    expense_type: ExpenseType
    amount: float = Field(..., gt=0)
    date: datetime = Field(default_factory=datetime.utcnow)

    # Context
    description: str
    odometer_reading: Optional[float] = None

    # Fuel Specific (if expense_type = fuel)
    fuel_quantity: Optional[float] = None  # liters
    fuel_price_per_liter: Optional[float] = None

    # Charging Specific (if expense_type = charging)
    charging_session_id: Optional[str] = None
    kw_consumed: Optional[float] = None
    start_soc: Optional[float] = None
    end_soc: Optional[float] = None
    charging_station_name: Optional[str] = None
    cost_per_kwh: Optional[float] = None

    # Association
    driver_id: Optional[str] = None
    trip_id: Optional[str] = None

    # Payment
    payment_method: Optional[str] = None  # cash, card, upi, credit
    receipt_file_id: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_type: Optional[ExpenseType] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    odometer_reading: Optional[float] = None
    fuel_quantity: Optional[float] = None
    fuel_price_per_liter: Optional[float] = None
    payment_method: Optional[str] = None
    receipt_file_id: Optional[str] = None


class ExpenseInDB(ExpenseBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Expense(ExpenseInDB):
    pass
```

**Checkpoint 1.6:** ✅ Expense model created

---

### Day 4: Database Indexes & Migrations

#### Step 1.7: Create Database Indexes

**File:** `backend/create_vehicles_indexes.py`

```python
"""
Create indexes for vehicle-related collections
Run this once: python create_vehicles_indexes.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def create_indexes():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print("Creating indexes for vehicle collections...")

    # Vehicles collection
    await db.vehicles.create_index("vehicle_id", unique=True)
    await db.vehicles.create_index("registration_number", unique=True)
    await db.vehicles.create_index("status")
    await db.vehicles.create_index("fuel_type")
    await db.vehicles.create_index("is_electric")
    await db.vehicles.create_index("current_driver_id")
    await db.vehicles.create_index([("insurance_expiry", 1)])
    await db.vehicles.create_index([("created_at", -1)])
    print("✓ Vehicles indexes created")

    # Vehicle Assignments collection
    await db.vehicle_assignments.create_index([("vehicle_id", 1), ("status", 1)])
    await db.vehicle_assignments.create_index([("driver_id", 1), ("status", 1)])
    await db.vehicle_assignments.create_index([("assigned_at", -1)])
    await db.vehicle_assignments.create_index("status")
    print("✓ Vehicle assignments indexes created")

    # Charging Sessions collection (EV)
    await db.charging_sessions.create_index([("vehicle_id", 1), ("started_at", -1)])
    await db.charging_sessions.create_index([("driver_id", 1), ("started_at", -1)])
    await db.charging_sessions.create_index("status")
    await db.charging_sessions.create_index([("started_at", -1)])
    print("✓ Charging sessions indexes created")

    # Battery Health Logs collection (EV)
    await db.battery_health_logs.create_index([("vehicle_id", 1), ("measured_at", -1)])
    await db.battery_health_logs.create_index([("measured_at", -1)])
    print("✓ Battery health logs indexes created")

    # Vehicle Maintenance collection
    await db.vehicle_maintenance.create_index([("vehicle_id", 1), ("scheduled_date", -1)])
    await db.vehicle_maintenance.create_index("status")
    await db.vehicle_maintenance.create_index([("scheduled_date", 1)])
    await db.vehicle_maintenance.create_index([("created_at", -1)])
    print("✓ Vehicle maintenance indexes created")

    # Vehicle Expenses collection
    await db.vehicle_expenses.create_index([("vehicle_id", 1), ("date", -1)])
    await db.vehicle_expenses.create_index([("driver_id", 1), ("date", -1)])
    await db.vehicle_expenses.create_index("expense_type")
    await db.vehicle_expenses.create_index([("date", -1)])
    print("✓ Vehicle expenses indexes created")

    print("\n✅ All indexes created successfully!")

    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
```

**Run it:**

```bash
cd backend
source venv/bin/activate
python create_vehicles_indexes.py
```

**Checkpoint 1.7:** ✅ Database indexes created

---

#### Step 1.8: Create Migration Script

**File:** `backend/migrate_vehicles_from_drivers.py`

```python
"""
Migrate existing vehicle data from driver records to separate vehicle entities
Run this once: python migrate_vehicles_from_drivers.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from datetime import datetime


async def migrate_vehicles():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print("Starting vehicle migration from drivers...")

    # Get all drivers with vehicle info
    drivers_cursor = db.drivers.find({
        "vehicle_type": {"$exists": True},
        "vehicle_number": {"$exists": True}
    })

    migrated = 0
    skipped = 0

    async for driver in drivers_cursor:
        vehicle_number = driver.get("vehicle_number")

        if not vehicle_number:
            skipped += 1
            continue

        # Check if vehicle already exists
        existing = await db.vehicles.find_one({"registration_number": vehicle_number})
        if existing:
            print(f"  Skipping {vehicle_number} - already exists")
            # Update driver with vehicle_id
            await db.drivers.update_one(
                {"_id": driver["_id"]},
                {"$set": {"assigned_vehicle_id": str(existing["_id"])}}
            )
            skipped += 1
            continue

        # Generate vehicle_id
        count = await db.vehicles.count_documents({})
        vehicle_id = f"VEH{str(count + 1).zfill(3)}"

        # Determine if electric (you may need to adjust this logic)
        is_electric = driver.get("vehicle_type", "").lower() in ["electric", "ev", "electric vehicle"]

        # Create vehicle document
        vehicle_doc = {
            "vehicle_id": vehicle_id,
            "registration_number": vehicle_number,
            "make": driver.get("vehicle_make", "Unknown"),
            "model": driver.get("vehicle_model", "Unknown"),
            "year": driver.get("vehicle_year", 2020),
            "color": driver.get("vehicle_color", "Unknown"),
            "vehicle_type": driver.get("vehicle_type", "Unknown"),
            "seating_capacity": driver.get("seating_capacity", 5),
            "fuel_type": "electric" if is_electric else "diesel",
            "is_electric": is_electric,
            "status": "in_use",
            "condition": "good",
            "current_driver_id": driver.get("user_id"),
            "odometer_reading": driver.get("odometer_reading", 0),
            "documents": {},
            "photos": {},
            "ownership_type": "owned",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "migration_script"
        }

        # Add EV details if electric
        if is_electric:
            vehicle_doc["ev_details"] = {
                "battery_capacity": 60,  # Default, update manually
                "current_battery_level": 100,
                "estimated_range": 340,
                "current_range": 340,
                "charging_type": "AC+DC",
                "max_charging_speed": 50,
                "charging_status": "not_charging",
                "battery_health": 100,
                "charging_cycles": 0,
                "home_charging_available": False
            }

        # Insert vehicle
        result = await db.vehicles.insert_one(vehicle_doc)
        vehicle_oid = result.inserted_id

        # Create permanent assignment
        assignment_doc = {
            "vehicle_id": vehicle_id,
            "driver_id": driver.get("user_id"),
            "assigned_at": datetime.utcnow(),
            "assignment_type": "permanent",
            "odometer_at_assignment": driver.get("odometer_reading", 0),
            "condition_at_assignment": "good",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.vehicle_assignments.insert_one(assignment_doc)

        # Update driver with vehicle reference
        await db.drivers.update_one(
            {"_id": driver["_id"]},
            {
                "$set": {
                    "assigned_vehicle_id": vehicle_id,
                    "vehicle_assignment_type": "permanent",
                    "migrated_to_fleet": True
                }
            }
        )

        migrated += 1
        print(f"  ✓ Migrated {vehicle_number} → {vehicle_id}")

    print(f"\n✅ Migration complete!")
    print(f"   Migrated: {migrated}")
    print(f"   Skipped: {skipped}")

    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_vehicles())
```

**Run it:**

```bash
python migrate_vehicles_from_drivers.py
```

**Checkpoint 1.8:** ✅ Existing data migrated

---

### Day 5: Update Existing Models

#### Step 1.9: Update Driver Model

**File:** `backend/app/models/driver.py` (add these fields)

```python
# Add to existing DriverBase class:

assigned_vehicle_id: Optional[str] = None  # Current assigned vehicle
vehicle_assignment_type: Optional[str] = None  # permanent, temporary
migrated_to_fleet: bool = Field(default=False)  # Migration flag

# REMOVE or deprecate (keep for backward compatibility):
# vehicle_type
# vehicle_number
```

**Checkpoint 1.9:** ✅ Driver model updated

---

#### Step 1.10: Update Trip Model

**File:** `backend/app/models/trip.py` (add these fields)

```python
# Add to existing TripBase class:

vehicle_id: Optional[str] = None  # Which vehicle was used
odometer_start: Optional[float] = None
odometer_end: Optional[float] = None

# For Fuel Vehicles
fuel_consumed: Optional[float] = None  # liters

# For Electric Vehicles
battery_level_start: Optional[float] = None  # %
battery_level_end: Optional[float] = None    # %
battery_consumed: Optional[float] = None     # %
energy_consumed: Optional[float] = None      # kWh
charging_stops: Optional[int] = Field(default=0)
charging_session_ids: Optional[List[str]] = Field(default_factory=list)
```

**Checkpoint 1.10:** ✅ Trip model updated

---

**End of Week 1 Checklist:**

- [✅] All 6 models created (vehicle, assignment, charging, battery_health, maintenance, expense)
- [✅] Database indexes created
- [✅] Migration script created and run
- [✅] Existing models updated
- [✅] All models tested with pydantic

**Commit your work:**

```bash
git add backend/app/models/
git add backend/create_vehicles_indexes.py
git add backend/migrate_vehicles_from_drivers.py
git commit -m "feat: Add fleet management database models and migration"
```

---

## Week 2: API Development

### Day 6-7: Vehicle CRUD Endpoints

#### Step 2.1: Create Vehicles API Endpoint

**File:** `backend/app/api/v1/endpoints/vehicles.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime, timedelta

from app.models.vehicle import (
    Vehicle, VehicleCreate, VehicleUpdate, VehicleStatus
)
from app.models.user import User
from app.api import deps
from app.db.mongodb import get_database

router = APIRouter()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle: VehicleCreate,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Create a new vehicle (Admin/Super Admin only)
    """
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Check if vehicle_id or registration_number already exists
    existing = await db.vehicles.find_one({
        "$or": [
            {"vehicle_id": vehicle.vehicle_id},
            {"registration_number": vehicle.registration_number}
        ]
    })

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle ID or Registration Number already exists"
        )

    # Prepare vehicle document
    vehicle_dict = vehicle.model_dump()
    vehicle_dict["created_at"] = datetime.utcnow()
    vehicle_dict["updated_at"] = datetime.utcnow()
    vehicle_dict["created_by"] = current_user.user_id

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
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    fuel_type: Optional[str] = None,
    is_electric: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    List all vehicles with filters
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


@router.get("/{vehicle_id}", response_model=dict)
async def get_vehicle(
    vehicle_id: str,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get vehicle details by ID
    """
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    vehicle["_id"] = str(vehicle["_id"])

    return {"vehicle": vehicle}


@router.put("/{vehicle_id}", response_model=dict)
async def update_vehicle(
    vehicle_id: str,
    vehicle_update: VehicleUpdate,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Update vehicle details (Admin/Super Admin only)
    """
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Prepare update data (only non-None fields)
    update_data = {k: v for k, v in vehicle_update.model_dump().items() if v is not None}
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


@router.delete("/{vehicle_id}", response_model=dict)
async def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Delete vehicle (Admin/Super Admin only)
    Soft delete - set status to inactive
    """
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Check if vehicle exists
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
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

    return {"message": "Vehicle deleted successfully"}


@router.patch("/{vehicle_id}/status", response_model=dict)
async def update_vehicle_status(
    vehicle_id: str,
    new_status: VehicleStatus,
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Update vehicle status
    """
    # Check permissions
    if current_user.role not in ["admin", "super_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
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

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return {"message": f"Vehicle status updated to {new_status}"}


@router.get("/available/list", response_model=dict)
async def get_available_vehicles(
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get all available vehicles
    """
    cursor = db.vehicles.find({"status": VehicleStatus.AVAILABLE})
    vehicles = await cursor.to_list(length=100)

    for vehicle in vehicles:
        vehicle["_id"] = str(vehicle["_id"])

    return {
        "total": len(vehicles),
        "vehicles": vehicles
    }


@router.get("/statistics/overview", response_model=dict)
async def get_fleet_statistics(
    current_user: User = Depends(deps.get_current_user),
    db = Depends(get_database)
):
    """
    Get fleet statistics overview
    """
    # Count by status
    total = await db.vehicles.count_documents({})
    available = await db.vehicles.count_documents({"status": VehicleStatus.AVAILABLE})
    in_use = await db.vehicles.count_documents({"status": VehicleStatus.IN_USE})
    maintenance = await db.vehicles.count_documents({"status": VehicleStatus.MAINTENANCE})
    charging = await db.vehicles.count_documents({"status": VehicleStatus.CHARGING})

    # Count by fuel type
    electric = await db.vehicles.count_documents({"is_electric": True})
    fuel = await db.vehicles.count_documents({"is_electric": False})

    # Documents expiring soon (next 30 days)
    thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
    insurance_expiring = await db.vehicles.count_documents({
        "insurance_expiry": {"$lte": thirty_days_from_now, "$gte": datetime.utcnow()}
    })

    return {
        "total_vehicles": total,
        "by_status": {
            "available": available,
            "in_use": in_use,
            "maintenance": maintenance,
            "charging": charging
        },
        "by_fuel_type": {
            "electric": electric,
            "fuel": fuel
        },
        "alerts": {
            "insurance_expiring_soon": insurance_expiring
        }
    }
```

**Checkpoint 2.1:** ✅ Vehicle CRUD endpoints created

---

_[Continue with remaining weeks in next response due to length...]_

**Would you like me to continue with:**

1. Week 2: Complete API Development (Assignment, Charging, Maintenance, Expenses)
2. Week 3-6: Frontend Implementation
3. Testing & Deployment

Let me know and I'll continue the detailed step-by-step guide!
