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
    OIL_CHANGE = "oil_change"
    BRAKE_SERVICE = "brake_service"
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
    description: str = Field(..., min_length=3, description="Description of maintenance work")
    
    # Scheduling
    scheduled_date: datetime = Field(..., description="Scheduled date for maintenance")
    actual_date: Optional[datetime] = Field(None, description="Actual date when work was done")
    
    # Status
    status: MaintenanceStatus = Field(default=MaintenanceStatus.SCHEDULED)
    
    # Details
    service_provider: Optional[str] = Field(None, description="Service center or mechanic name")
    cost: Optional[float] = Field(None, ge=0, description="Cost in rupees")
    odometer_reading: Optional[float] = Field(None, ge=0, description="Km reading at service")
    
    # Parts & Work
    parts_replaced: Optional[List[str]] = Field(None, description="List of parts replaced")
    work_done: Optional[str] = Field(None, description="Detailed work performed")
    
    # Next Service
    next_service_km: Optional[float] = Field(None, gt=0, description="Next service at km")
    next_service_date: Optional[datetime] = Field(None, description="Next service date")
    
    # Documents
    invoice_file_id: Optional[str] = Field(None, description="Invoice/receipt file ID")
    
    # Downtime
    vehicle_unavailable_from: Optional[datetime] = Field(None, description="Vehicle unavailable from")
    vehicle_unavailable_until: Optional[datetime] = Field(None, description="Vehicle unavailable until")
    
    # Notes
    notes: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    maintenance_type: Optional[MaintenanceType] = None
    description: Optional[str] = Field(None, min_length=3)
    scheduled_date: Optional[datetime] = None
    actual_date: Optional[datetime] = None
    status: Optional[MaintenanceStatus] = None
    service_provider: Optional[str] = None
    cost: Optional[float] = Field(None, ge=0)
    odometer_reading: Optional[float] = Field(None, ge=0)
    parts_replaced: Optional[List[str]] = None
    work_done: Optional[str] = None
    next_service_km: Optional[float] = Field(None, gt=0)
    next_service_date: Optional[datetime] = None
    invoice_file_id: Optional[str] = None
    vehicle_unavailable_from: Optional[datetime] = None
    vehicle_unavailable_until: Optional[datetime] = None
    notes: Optional[str] = None


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


# Helper functions for maintenance management

def calculate_downtime_hours(unavailable_from: Optional[datetime], 
                             unavailable_until: Optional[datetime]) -> float:
    """
    Calculate vehicle downtime in hours
    
    Args:
        unavailable_from: Start of downtime
        unavailable_until: End of downtime
    
    Returns:
        Downtime in hours
    """
    if not unavailable_from or not unavailable_until:
        return 0.0
    
    delta = unavailable_until - unavailable_from
    hours = delta.total_seconds() / 3600
    return round(max(0, hours), 2)


def is_maintenance_overdue(next_service_date: Optional[datetime],
                           next_service_km: Optional[float],
                           current_odometer: float) -> tuple[bool, str]:
    """
    Check if maintenance is overdue
    
    Args:
        next_service_date: Scheduled next service date
        next_service_km: Scheduled next service km
        current_odometer: Current vehicle odometer reading
    
    Returns:
        Tuple of (is_overdue: bool, reason: str)
    """
    reasons = []
    
    if next_service_date and datetime.utcnow() > next_service_date:
        days_overdue = (datetime.utcnow() - next_service_date).days
        reasons.append(f"Overdue by {days_overdue} days")
    
    if next_service_km and current_odometer >= next_service_km:
        km_over = current_odometer - next_service_km
        reasons.append(f"Exceeded by {km_over:.0f} km")
    
    is_overdue = len(reasons) > 0
    reason = " | ".join(reasons) if reasons else "Up to date"
    
    return is_overdue, reason


def get_maintenance_priority(maintenance_type: MaintenanceType, 
                             is_overdue: bool) -> str:
    """
    Get priority level for maintenance
    
    Args:
        maintenance_type: Type of maintenance
        is_overdue: Whether maintenance is overdue
    
    Returns:
        Priority level: critical, high, medium, low
    """
    critical_types = [
        MaintenanceType.BRAKE_SERVICE,
        MaintenanceType.TIRE_CHANGE,
        MaintenanceType.BATTERY_CHECK
    ]
    
    high_priority_types = [
        MaintenanceType.ROUTINE_SERVICE,
        MaintenanceType.OIL_CHANGE
    ]
    
    if maintenance_type in critical_types:
        return "critical" if is_overdue else "high"
    
    if maintenance_type in high_priority_types:
        return "high" if is_overdue else "medium"
    
    return "medium" if is_overdue else "low"


def calculate_next_service_km(current_km: float, service_interval_km: int = 5000) -> float:
    """
    Calculate next service km based on current odometer
    
    Args:
        current_km: Current odometer reading
        service_interval_km: Service interval (default 5000 km)
    
    Returns:
        Next service km
    """
    return current_km + service_interval_km


def get_maintenance_cost_summary(maintenances: List['Maintenance']) -> dict:
    """
    Calculate cost summary for maintenance records
    
    Args:
        maintenances: List of maintenance records
    
    Returns:
        Dictionary with cost breakdown
    """
    total_cost = 0.0
    by_type = {}
    completed_count = 0
    
    for maintenance in maintenances:
        if maintenance.cost:
            total_cost += maintenance.cost
            
            # Group by type
            type_name = maintenance.maintenance_type.value
            if type_name not in by_type:
                by_type[type_name] = 0.0
            by_type[type_name] += maintenance.cost
        
        if maintenance.status == MaintenanceStatus.COMPLETED:
            completed_count += 1
    
    return {
        "total_cost": round(total_cost, 2),
        "by_type": {k: round(v, 2) for k, v in by_type.items()},
        "completed_count": completed_count,
        "total_count": len(maintenances),
        "average_cost": round(total_cost / len(maintenances), 2) if maintenances else 0.0
    }

