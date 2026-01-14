from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from app.api.deps import get_current_active_user
from app.db.mongodb import get_database
from bson import ObjectId

router = APIRouter()


@router.get("/my-earnings")
async def get_my_earnings(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Calculate driver earnings based on trip sheet trips.
    Excludes Microsoft trips (those are covered by salary).
    """
    db = get_database()
    
    # If no month specified, use current month
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")
    
    # Get all trips for this user in the specified month
    # Exclude Microsoft trips (site = "Microsoft")
    query = {
        "user_id": str(current_user["_id"]),
        "date": {"$regex": f"^{month}"},
        "site": {"$ne": "Microsoft"}  # Exclude Microsoft trips
    }
    
    trips = await db.trips.find(query).to_list(1000)
    
    # Get all trip types to get commission rates
    trip_types = await db.trip_types.find({"is_active": True}).to_list(100)
    trip_type_map = {tt["name"]: tt for tt in trip_types}
    
    earnings_by_type = {}
    total_gross_amount = 0.0
    total_expenses = 0.0
    total_earnings = 0.0
    trip_count = 0
    trips_without_commission = 0
    
    for trip in trips:
        trip_type_name = trip.get("trip_type")
        trip_gross_amount = trip.get("amount", 0) or 0  # What customer paid
        trip_expenses = trip.get("expenses", 0) or 0
        
        if not trip_type_name or trip_type_name not in trip_type_map:
            # Trip type not found or not set
            trips_without_commission += 1
            continue
        
        trip_type = trip_type_map[trip_type_name]
        commission_type = trip_type.get("commission_type")
        commission_value = trip_type.get("commission_value")
        
        if not commission_type or commission_value is None:
            # No commission set for this trip type
            trips_without_commission += 1
            continue
        
        # Calculate net amount first (gross - expenses)
        trip_net_amount = trip_gross_amount - trip_expenses
        
        # Calculate driver earnings based on NET AMOUNT
        trip_earnings = 0.0
        if commission_type == "amount":
            # Flat amount per trip (no calculation needed)
            trip_earnings = commission_value
        elif commission_type == "percentage":
            # Percentage of NET amount (after expenses)
            if trip_net_amount > 0:
                trip_earnings = (commission_value / 100.0) * trip_net_amount
            elif trip_gross_amount > 0:
                # If net is negative or zero but gross exists, still calculate
                trip_earnings = (commission_value / 100.0) * trip_net_amount
            else:
                # No amount set on trip, can't calculate percentage
                trips_without_commission += 1
                continue
        
        # Accumulate earnings by trip type
        if trip_type_name not in earnings_by_type:
            earnings_by_type[trip_type_name] = {
                "trip_type": trip_type_name,
                "commission_type": commission_type,
                "commission_value": commission_value,
                "trip_count": 0,
                "total_gross_amount": 0.0,
                "total_expenses": 0.0,
                "total_net_amount": 0.0,
                "total_earnings": 0.0,
                "trips": []
            }
        
        earnings_by_type[trip_type_name]["trip_count"] += 1
        earnings_by_type[trip_type_name]["total_gross_amount"] += trip_gross_amount
        earnings_by_type[trip_type_name]["total_expenses"] += trip_expenses
        earnings_by_type[trip_type_name]["total_net_amount"] += trip_net_amount
        earnings_by_type[trip_type_name]["total_earnings"] += trip_earnings
        earnings_by_type[trip_type_name]["trips"].append({
            "trip_id": trip["trip_id"],
            "date": trip["date"],
            "gross_amount": trip_gross_amount,
            "expenses": trip_expenses,
            "net_amount": trip_net_amount,
            "earnings": trip_earnings
        })
        
        total_gross_amount += trip_gross_amount
        total_expenses += trip_expenses
        total_earnings += trip_earnings
        trip_count += 1
    
    # Calculate total net amount
    total_net_amount = total_gross_amount - total_expenses
    
    # Get user's salary for comparison (salary is for Microsoft work)
    monthly_salary = current_user.get("monthly_salary", 0) or 0
    
    return {
        "month": month,
        "total_gross_amount": round(total_gross_amount, 2),
        "total_expenses": round(total_expenses, 2),
        "total_net_amount": round(total_net_amount, 2),
        "total_earnings": round(total_earnings, 2),
        "monthly_salary": round(monthly_salary, 2),
        "total_income": round(total_earnings + monthly_salary, 2),
        "trip_count": trip_count,
        "trips_without_commission": trips_without_commission,
        "earnings_by_type": list(earnings_by_type.values()),
        "summary": {
            "gross_amount": round(total_gross_amount, 2),
            "expenses": round(total_expenses, 2),
            "net_amount": round(total_net_amount, 2),
            "earnings_from_trips": round(total_earnings, 2),
            "microsoft_salary": round(monthly_salary, 2),
            "total_income": round(total_earnings + monthly_salary, 2)
        }
    }


@router.get("/admin/driver-earnings/{user_id}")
async def get_driver_earnings_admin(
    user_id: str,
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Admin endpoint to view any driver's earnings.
    """
    # Check if current user is admin
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    db = get_database()
    
    # Get the driver user
    driver = await db.users.find_one({"_id": ObjectId(user_id)})
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    # If no month specified, use current month
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")
    
    # Get all trips for this driver in the specified month (excluding Microsoft)
    query = {
        "user_id": user_id,
        "date": {"$regex": f"^{month}"},
        "site": {"$ne": "Microsoft"}
    }
    
    trips = await db.trips.find(query).to_list(1000)
    
    # Get all trip types
    trip_types = await db.trip_types.find({"is_active": True}).to_list(100)
    trip_type_map = {tt["name"]: tt for tt in trip_types}
    
    earnings_by_type = {}
    total_gross_amount = 0.0
    total_expenses = 0.0
    total_earnings = 0.0
    trip_count = 0
    trips_without_commission = 0
    
    for trip in trips:
        trip_type_name = trip.get("trip_type")
        trip_gross_amount = trip.get("amount", 0) or 0  # What customer paid
        trip_expenses = trip.get("expenses", 0) or 0
        
        if not trip_type_name or trip_type_name not in trip_type_map:
            trips_without_commission += 1
            continue
        
        trip_type = trip_type_map[trip_type_name]
        commission_type = trip_type.get("commission_type")
        commission_value = trip_type.get("commission_value")
        
        if not commission_type or commission_value is None:
            trips_without_commission += 1
            continue
        
        # Calculate net amount first (gross - expenses)
        trip_net_amount = trip_gross_amount - trip_expenses
        
        # Calculate driver earnings based on NET AMOUNT
        trip_earnings = 0.0
        if commission_type == "amount":
            # Flat amount per trip (no calculation needed)
            trip_earnings = commission_value
        elif commission_type == "percentage":
            # Percentage of NET amount (after expenses)
            if trip_net_amount > 0:
                trip_earnings = (commission_value / 100.0) * trip_net_amount
            elif trip_gross_amount > 0:
                # If net is negative or zero but gross exists, still calculate
                trip_earnings = (commission_value / 100.0) * trip_net_amount
            else:
                # No amount set on trip, can't calculate percentage
                trips_without_commission += 1
                continue
        
        if trip_type_name not in earnings_by_type:
            earnings_by_type[trip_type_name] = {
                "trip_type": trip_type_name,
                "commission_type": commission_type,
                "commission_value": commission_value,
                "trip_count": 0,
                "total_gross_amount": 0.0,
                "total_expenses": 0.0,
                "total_net_amount": 0.0,
                "total_earnings": 0.0
            }
        
        earnings_by_type[trip_type_name]["trip_count"] += 1
        earnings_by_type[trip_type_name]["total_gross_amount"] += trip_gross_amount
        earnings_by_type[trip_type_name]["total_expenses"] += trip_expenses
        earnings_by_type[trip_type_name]["total_net_amount"] += trip_net_amount
        earnings_by_type[trip_type_name]["total_earnings"] += trip_earnings
        
        total_gross_amount += trip_gross_amount
        total_expenses += trip_expenses
        total_earnings += trip_earnings
        trip_count += 1
    
    total_net_amount = total_gross_amount - total_expenses
    monthly_salary = driver.get("monthly_salary", 0) or 0
    
    return {
        "driver_name": driver.get("full_name"),
        "driver_id": user_id,
        "month": month,
        "total_gross_amount": round(total_gross_amount, 2),
        "total_expenses": round(total_expenses, 2),
        "total_net_amount": round(total_net_amount, 2),
        "total_earnings": round(total_earnings, 2),
        "monthly_salary": round(monthly_salary, 2),
        "total_income": round(total_earnings + monthly_salary, 2),
        "trip_count": trip_count,
        "trips_without_commission": trips_without_commission,
        "earnings_by_type": list(earnings_by_type.values()),
        "summary": {
            "gross_amount": round(total_gross_amount, 2),
            "expenses": round(total_expenses, 2),
            "net_amount": round(total_net_amount, 2),
            "earnings_from_trips": round(total_earnings, 2),
            "microsoft_salary": round(monthly_salary, 2),
            "total_income": round(total_earnings + monthly_salary, 2)
        }
    }

