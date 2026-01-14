from .user import User, UserCreate, UserUpdate
from .driver import Driver, DriverCreate, DriverUpdate
from .role import Role
from .status import UserStatus, UserStatusCreate, StatusCode
from .trip import Trip, TripCreate, TripUpdate
from .file import FileDocument, FileInDB
from .vehicle import (
    Vehicle,
    VehicleCreate,
    VehicleUpdate,
    VehicleStatus,
    VehicleCondition,
    FuelType,
    OwnershipType,
    VehicleDocuments,
    VehiclePhotos,
    EVDetails
)
from .vehicle_assignment import (
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentType,
    AssignmentStatus
)
from .charging_session import (
    ChargingSession,
    ChargingSessionCreate,
    ChargingSessionComplete,
    ChargingSessionUpdate,
    ChargingType,
    ChargingStatus,
    calculate_charging_metrics
)
from .battery_health import (
    BatteryHealth,
    BatteryHealthCreate,
    BatteryHealthUpdate,
    calculate_degradation_rate,
    calculate_battery_health,
    estimate_replacement_needed,
    get_battery_service_recommendations
)
from .vehicle_maintenance import (
    Maintenance,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceType,
    MaintenanceStatus,
    calculate_downtime_hours,
    is_maintenance_overdue,
    get_maintenance_priority,
    calculate_next_service_km,
    get_maintenance_cost_summary
)
from .vehicle_expense import (
    Expense,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseType,
    calculate_fuel_efficiency,
    calculate_cost_per_km,
    get_expense_summary,
    compare_fuel_vs_charging_costs,
    get_top_expense_categories
)

__all__ = [
    "User",
    "UserCreate",
    "UserUpdate",
    "Driver",
    "DriverCreate",
    "DriverUpdate",
    "Role",
    "UserStatus",
    "UserStatusCreate",
    "StatusCode",
    "Trip",
    "TripCreate",
    "TripUpdate",
    "FileDocument",
    "FileInDB",
    "Vehicle",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleStatus",
    "VehicleCondition",
    "FuelType",
    "OwnershipType",
    "VehicleDocuments",
    "VehiclePhotos",
    "EVDetails",
    "Assignment",
    "AssignmentCreate",
    "AssignmentUpdate",
    "AssignmentType",
    "AssignmentStatus",
    "ChargingSession",
    "ChargingSessionCreate",
    "ChargingSessionComplete",
    "ChargingSessionUpdate",
    "ChargingType",
    "ChargingStatus",
    "calculate_charging_metrics",
    "BatteryHealth",
    "BatteryHealthCreate",
    "BatteryHealthUpdate",
    "calculate_degradation_rate",
    "calculate_battery_health",
    "estimate_replacement_needed",
    "get_battery_service_recommendations",
    "Maintenance",
    "MaintenanceCreate",
    "MaintenanceUpdate",
    "MaintenanceType",
    "MaintenanceStatus",
    "calculate_downtime_hours",
    "is_maintenance_overdue",
    "get_maintenance_priority",
    "calculate_next_service_km",
    "get_maintenance_cost_summary",
    "Expense",
    "ExpenseCreate",
    "ExpenseUpdate",
    "ExpenseType",
    "calculate_fuel_efficiency",
    "calculate_cost_per_km",
    "get_expense_summary",
    "compare_fuel_vs_charging_costs",
    "get_top_expense_categories",
]

