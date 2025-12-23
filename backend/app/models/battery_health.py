from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

from .vehicle import PyObjectId


class BatteryHealthBase(BaseModel):
    vehicle_id: str
    
    # Health Metrics
    battery_health_percentage: float = Field(..., ge=0, le=100, description="Battery health %")
    total_charging_cycles: int = Field(default=0, ge=0, description="Total full charge cycles")
    actual_capacity: float = Field(..., gt=0, description="Current capacity in kWh")
    original_capacity: float = Field(..., gt=0, description="Original capacity in kWh")
    degradation_rate: float = Field(..., ge=0, description="Degradation percentage from new")
    
    # Performance
    max_range_current: float = Field(..., gt=0, description="Current max range in km")
    max_range_original: float = Field(..., gt=0, description="Original max range in km")
    avg_consumption: float = Field(..., gt=0, description="kWh per 100 km")
    
    # Temperature
    avg_battery_temp: Optional[float] = Field(None, description="Average battery temp in °C")
    max_battery_temp: Optional[float] = Field(None, description="Peak temperature recorded in °C")
    
    # Recommendations
    needs_battery_service: bool = Field(default=False)
    estimated_replacement_date: Optional[datetime] = None
    service_recommendations: Optional[str] = None
    
    # Measurement
    measured_at: datetime = Field(default_factory=datetime.utcnow)
    measured_by: str = Field(default="system", description="system, service_center, manual")
    odometer_reading: float = Field(..., ge=0)


class BatteryHealthCreate(BatteryHealthBase):
    pass


class BatteryHealthUpdate(BaseModel):
    battery_health_percentage: Optional[float] = Field(None, ge=0, le=100)
    total_charging_cycles: Optional[int] = Field(None, ge=0)
    actual_capacity: Optional[float] = Field(None, gt=0)
    degradation_rate: Optional[float] = Field(None, ge=0)
    max_range_current: Optional[float] = Field(None, gt=0)
    avg_consumption: Optional[float] = Field(None, gt=0)
    avg_battery_temp: Optional[float] = None
    max_battery_temp: Optional[float] = None
    needs_battery_service: Optional[bool] = None
    estimated_replacement_date: Optional[datetime] = None
    service_recommendations: Optional[str] = None
    odometer_reading: Optional[float] = Field(None, ge=0)


class BatteryHealthInDB(BatteryHealthBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class BatteryHealth(BatteryHealthInDB):
    pass


# Helper functions for battery health calculations
def calculate_degradation_rate(original_capacity: float, actual_capacity: float) -> float:
    """
    Calculate battery degradation rate
    
    Args:
        original_capacity: Original battery capacity in kWh
        actual_capacity: Current battery capacity in kWh
    
    Returns:
        Degradation rate as percentage
    """
    if original_capacity <= 0:
        return 0.0
    
    degradation = ((original_capacity - actual_capacity) / original_capacity) * 100
    return round(max(0, degradation), 2)


def calculate_battery_health(actual_capacity: float, original_capacity: float) -> float:
    """
    Calculate battery health percentage
    
    Args:
        actual_capacity: Current battery capacity in kWh
        original_capacity: Original battery capacity in kWh
    
    Returns:
        Battery health percentage (0-100)
    """
    if original_capacity <= 0:
        return 0.0
    
    health = (actual_capacity / original_capacity) * 100
    return round(min(100, max(0, health)), 2)


def estimate_replacement_needed(battery_health: float, charging_cycles: int) -> bool:
    """
    Determine if battery replacement is needed
    
    Battery is typically considered for replacement when:
    - Health drops below 80%
    - OR charging cycles exceed 1000 (depends on battery type)
    
    Args:
        battery_health: Current battery health percentage
        charging_cycles: Total charging cycles
    
    Returns:
        True if replacement recommended
    """
    return battery_health < 80 or charging_cycles > 1000


def get_battery_service_recommendations(battery_health: float, degradation_rate: float, 
                                        charging_cycles: int, max_temp: Optional[float] = None) -> str:
    """
    Get service recommendations based on battery metrics
    
    Args:
        battery_health: Current battery health percentage
        degradation_rate: Degradation rate percentage
        charging_cycles: Total charging cycles
        max_temp: Maximum temperature recorded
    
    Returns:
        Service recommendation string
    """
    recommendations = []
    
    if battery_health < 80:
        recommendations.append("⚠️ Battery health below 80% - Consider replacement")
    elif battery_health < 90:
        recommendations.append("💡 Battery health declining - Monitor closely")
    
    if degradation_rate > 15:
        recommendations.append("⚠️ High degradation rate - Check charging patterns")
    
    if charging_cycles > 1000:
        recommendations.append("⚠️ High cycle count - Battery nearing end of life")
    elif charging_cycles > 500:
        recommendations.append("💡 Moderate cycle count - Normal wear")
    
    if max_temp and max_temp > 45:
        recommendations.append("⚠️ High battery temperatures detected - Check cooling system")
    
    if battery_health > 95:
        recommendations.append("✅ Battery health is excellent")
    
    # Charging best practices
    if battery_health < 95:
        recommendations.append("💡 Tip: Avoid charging above 90% daily to extend battery life")
        recommendations.append("💡 Tip: Use slow charging when possible")
    
    return " | ".join(recommendations) if recommendations else "✅ Battery in good condition"

