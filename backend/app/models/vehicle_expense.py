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
    amount: float = Field(..., gt=0, description="Amount in rupees")
    date: datetime = Field(default_factory=datetime.utcnow, description="Expense date")
    
    # Context
    description: str = Field(..., min_length=3, description="Expense description")
    odometer_reading: Optional[float] = Field(None, ge=0, description="Odometer reading at expense")
    
    # Fuel Specific (if expense_type = fuel)
    fuel_quantity: Optional[float] = Field(None, gt=0, description="Fuel quantity in liters")
    fuel_price_per_liter: Optional[float] = Field(None, gt=0, description="Price per liter")
    
    # Charging Specific (if expense_type = charging)
    charging_session_id: Optional[str] = Field(None, description="Link to charging session")
    kw_consumed: Optional[float] = Field(None, gt=0, description="kWh consumed")
    start_soc: Optional[float] = Field(None, ge=0, le=100, description="Start State of Charge %")
    end_soc: Optional[float] = Field(None, ge=0, le=100, description="End State of Charge %")
    charging_station_name: Optional[str] = Field(None, description="Charging station name")
    cost_per_kwh: Optional[float] = Field(None, gt=0, description="Cost per kWh")
    
    # Maintenance Specific (if expense_type = maintenance)
    maintenance_id: Optional[str] = Field(None, description="Link to maintenance record")
    
    # Association
    driver_id: Optional[str] = Field(None, description="Driver who incurred expense")
    trip_id: Optional[str] = Field(None, description="Trip associated with expense")
    
    # Payment
    payment_method: Optional[str] = Field(None, description="cash, card, upi, credit")
    receipt_file_id: Optional[str] = Field(None, description="Receipt/invoice file ID")
    
    # Notes
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_type: Optional[ExpenseType] = None
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[datetime] = None
    description: Optional[str] = Field(None, min_length=3)
    odometer_reading: Optional[float] = Field(None, ge=0)
    fuel_quantity: Optional[float] = Field(None, gt=0)
    fuel_price_per_liter: Optional[float] = Field(None, gt=0)
    charging_session_id: Optional[str] = None
    kw_consumed: Optional[float] = Field(None, gt=0)
    start_soc: Optional[float] = Field(None, ge=0, le=100)
    end_soc: Optional[float] = Field(None, ge=0, le=100)
    charging_station_name: Optional[str] = None
    cost_per_kwh: Optional[float] = Field(None, gt=0)
    maintenance_id: Optional[str] = None
    driver_id: Optional[str] = None
    trip_id: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_file_id: Optional[str] = None
    notes: Optional[str] = None


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


# Helper functions for expense analytics

def calculate_fuel_efficiency(fuel_quantity: float, distance_km: float) -> float:
    """
    Calculate fuel efficiency (km per liter)
    
    Args:
        fuel_quantity: Fuel consumed in liters
        distance_km: Distance traveled in km
    
    Returns:
        Fuel efficiency in km/liter
    """
    if fuel_quantity <= 0:
        return 0.0
    
    return round(distance_km / fuel_quantity, 2)


def calculate_cost_per_km(total_cost: float, distance_km: float) -> float:
    """
    Calculate cost per kilometer
    
    Args:
        total_cost: Total cost in rupees
        distance_km: Distance traveled in km
    
    Returns:
        Cost per km in rupees
    """
    if distance_km <= 0:
        return 0.0
    
    return round(total_cost / distance_km, 2)


def get_expense_summary(expenses: list['Expense']) -> dict:
    """
    Calculate expense summary and breakdown
    
    Args:
        expenses: List of expense records
    
    Returns:
        Dictionary with expense analytics
    """
    total_amount = 0.0
    by_type = {}
    by_month = {}
    total_fuel_liters = 0.0
    total_kwh = 0.0
    
    for expense in expenses:
        # Total amount
        total_amount += expense.amount
        
        # By type
        type_name = expense.expense_type.value
        if type_name not in by_type:
            by_type[type_name] = {"count": 0, "amount": 0.0}
        by_type[type_name]["count"] += 1
        by_type[type_name]["amount"] += expense.amount
        
        # By month
        month_key = expense.date.strftime("%Y-%m")
        if month_key not in by_month:
            by_month[month_key] = 0.0
        by_month[month_key] += expense.amount
        
        # Fuel tracking
        if expense.fuel_quantity:
            total_fuel_liters += expense.fuel_quantity
        
        # Charging tracking
        if expense.kw_consumed:
            total_kwh += expense.kw_consumed
    
    # Round amounts
    for type_name in by_type:
        by_type[type_name]["amount"] = round(by_type[type_name]["amount"], 2)
    
    for month_key in by_month:
        by_month[month_key] = round(by_month[month_key], 2)
    
    return {
        "total_amount": round(total_amount, 2),
        "total_expenses": len(expenses),
        "by_type": by_type,
        "by_month": by_month,
        "total_fuel_liters": round(total_fuel_liters, 2),
        "total_kwh": round(total_kwh, 2),
        "average_expense": round(total_amount / len(expenses), 2) if expenses else 0.0
    }


def compare_fuel_vs_charging_costs(expenses: list['Expense']) -> dict:
    """
    Compare fuel costs vs charging costs (for hybrid fleets)
    
    Args:
        expenses: List of expense records
    
    Returns:
        Dictionary with cost comparison
    """
    fuel_cost = 0.0
    fuel_liters = 0.0
    charging_cost = 0.0
    charging_kwh = 0.0
    
    for expense in expenses:
        if expense.expense_type == ExpenseType.FUEL:
            fuel_cost += expense.amount
            if expense.fuel_quantity:
                fuel_liters += expense.fuel_quantity
        
        elif expense.expense_type == ExpenseType.CHARGING:
            charging_cost += expense.amount
            if expense.kw_consumed:
                charging_kwh += expense.kw_consumed
    
    avg_fuel_price = (fuel_cost / fuel_liters) if fuel_liters > 0 else 0.0
    avg_charging_price = (charging_cost / charging_kwh) if charging_kwh > 0 else 0.0
    
    # Rough equivalence: 1 liter fuel ≈ 10 kWh energy
    # This is approximate and depends on vehicle efficiency
    fuel_energy_kwh = fuel_liters * 10
    total_energy_kwh = fuel_energy_kwh + charging_kwh
    
    fuel_percentage = (fuel_energy_kwh / total_energy_kwh * 100) if total_energy_kwh > 0 else 0.0
    ev_percentage = (charging_kwh / total_energy_kwh * 100) if total_energy_kwh > 0 else 0.0
    
    return {
        "fuel": {
            "total_cost": round(fuel_cost, 2),
            "total_liters": round(fuel_liters, 2),
            "avg_price_per_liter": round(avg_fuel_price, 2),
            "energy_percentage": round(fuel_percentage, 2)
        },
        "charging": {
            "total_cost": round(charging_cost, 2),
            "total_kwh": round(charging_kwh, 2),
            "avg_price_per_kwh": round(avg_charging_price, 2),
            "energy_percentage": round(ev_percentage, 2)
        },
        "savings": round(fuel_cost - charging_cost, 2),
        "cost_difference_percentage": round(
            ((fuel_cost - charging_cost) / fuel_cost * 100) if fuel_cost > 0 else 0.0, 
            2
        )
    }


def get_top_expense_categories(expenses: list['Expense'], limit: int = 5) -> list:
    """
    Get top expense categories by amount
    
    Args:
        expenses: List of expense records
        limit: Number of top categories to return
    
    Returns:
        List of top categories with amounts
    """
    by_type = {}
    
    for expense in expenses:
        type_name = expense.expense_type.value
        if type_name not in by_type:
            by_type[type_name] = 0.0
        by_type[type_name] += expense.amount
    
    # Sort by amount descending
    sorted_types = sorted(by_type.items(), key=lambda x: x[1], reverse=True)
    
    return [
        {
            "category": category,
            "amount": round(amount, 2),
            "percentage": round((amount / sum(by_type.values()) * 100), 2) if by_type else 0.0
        }
        for category, amount in sorted_types[:limit]
    ]

