from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from ....db.mongodb import get_database
from ....models.money_request import MoneyRequest, MoneyRequestCreate, MoneyRequestUpdate, RequestStatus
from ...deps import get_current_active_user, get_current_admin_user

router = APIRouter()


def count_working_days_passed(year: int, month: int, current_day: int, working_days_per_month: int) -> int:
    """
    Count actual working days that have passed based on the working days pattern.
    - 22 days/month = Monday to Friday only
    - 26 days/month = Monday to Saturday only
    - Other values = use proportional calculation
    """
    if working_days_per_month <= 0:
        return 0
    
    # Determine working pattern based on working_days_per_month
    if working_days_per_month == 22:
        # Monday to Friday only (5 days/week)
        exclude_weekdays = [5, 6]  # Saturday=5, Sunday=6
    elif working_days_per_month == 26:
        # Monday to Saturday only (6 days/week)
        exclude_weekdays = [6]  # Sunday=6 only
    else:
        # For other values, use simple proportional calculation
        # Assume uniform distribution
        total_days_in_month = 31  # Max days
        ratio = working_days_per_month / total_days_in_month
        return int(current_day * ratio)
    
    # Count working days from 1st to current_day
    working_days_count = 0
    for day in range(1, current_day + 1):
        date = datetime(year, month, day)
        weekday = date.weekday()  # Monday=0, Sunday=6
        
        if weekday not in exclude_weekdays:
            working_days_count += 1
    
    return working_days_count


def calculate_advance_available(monthly_salary: float, working_days: int, year: int, month: int, current_day: int, already_advanced: float) -> dict:
    """
    Calculate available advance amount based on actual working days passed.
    Formula: (Salary / Working Days) × Actual Working Days Passed × 30% - Already Advanced
    """
    if not monthly_salary or not working_days or working_days == 0:
        return {
            "available": 0.0,
            "earned_so_far": 0.0,
            "max_advance": 0.0,
            "already_advanced": already_advanced,
            "working_days_passed": 0
        }
    
    # Count actual working days that have passed
    working_days_passed = count_working_days_passed(year, month, current_day, working_days)
    
    # Calculate salary earned so far based on actual working days
    per_day_salary = monthly_salary / working_days
    earned_so_far = per_day_salary * min(working_days_passed, working_days)
    
    # Maximum advance is 30% of earned salary
    max_advance = earned_so_far * 0.30
    
    # Available is max minus what's already been advanced
    available = max(0, max_advance - already_advanced)
    
    return {
        "available": round(available, 2),
        "earned_so_far": round(earned_so_far, 2),
        "max_advance": round(max_advance, 2),
        "already_advanced": round(already_advanced, 2),
        "working_days_passed": working_days_passed
    }


@router.get("/available-balance")
async def get_available_balance(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get available balance for advance and withdrawal
    """
    db = get_database()
    now = datetime.utcnow()
    current_month = now.strftime("%Y-%m")
    current_day = now.day
    current_year = now.year
    current_month_num = now.month
    
    # Get user's salary and working days
    monthly_salary = current_user.get("monthly_salary", 0) or 0
    working_days = current_user.get("working_days", 26) or 26
    
    # Calculate total advances taken this month (both approved and paid)
    advance_requests = await db.money_requests.find({
        "user_id": str(current_user["_id"]),
        "request_type": "advance",
        "month": current_month,
        "status": {"$in": ["approved", "paid"]}
    }).to_list(100)
    
    total_advanced = sum(req.get("amount", 0) for req in advance_requests)
    
    print(f"DEBUG - User: {current_user.get('full_name')}, Month: {current_month}")
    print(f"DEBUG - Advance requests found: {len(advance_requests)}")
    print(f"DEBUG - Total advanced: ₹{total_advanced}")
    
    # Calculate advance available with actual working days
    advance_info = calculate_advance_available(monthly_salary, working_days, current_year, current_month_num, current_day, total_advanced)
    
    # Get total earnings from trips this month
    # Exclude Microsoft trips
    trips = await db.trips.find({
        "user_id": str(current_user["_id"]),
        "date": {"$regex": f"^{current_month}"},
        "site": {"$ne": "Microsoft"}
    }).to_list(1000)
    
    # Calculate earnings
    trip_types = await db.trip_types.find({"is_active": True}).to_list(100)
    trip_type_map = {tt["name"]: tt for tt in trip_types}
    
    total_earnings = 0.0
    for trip in trips:
        trip_type_name = trip.get("trip_type")
        if not trip_type_name or trip_type_name not in trip_type_map:
            continue
        
        trip_type = trip_type_map[trip_type_name]
        commission_type = trip_type.get("commission_type")
        commission_value = trip_type.get("commission_value")
        
        if not commission_type or commission_value is None:
            continue
        
        trip_gross_amount = trip.get("amount", 0) or 0
        trip_expenses = trip.get("expenses", 0) or 0
        trip_net_amount = trip_gross_amount - trip_expenses
        
        if commission_type == "amount":
            total_earnings += commission_value
        elif commission_type == "percentage" and trip_net_amount > 0:
            total_earnings += (commission_value / 100.0) * trip_net_amount
    
    # Calculate total withdrawals this month (both approved and paid)
    withdrawal_requests = await db.money_requests.find({
        "user_id": str(current_user["_id"]),
        "request_type": "withdrawal",
        "month": current_month,
        "status": {"$in": ["approved", "paid"]}
    }).to_list(100)
    
    total_withdrawn = sum(req.get("amount", 0) for req in withdrawal_requests)
    
    print(f"DEBUG - Total earnings: ₹{total_earnings}")
    print(f"DEBUG - Withdrawal requests found: {len(withdrawal_requests)}")
    print(f"DEBUG - Total withdrawn: ₹{total_withdrawn}")
    
    earnings_available = max(0, total_earnings - total_withdrawn)
    
    print(f"DEBUG - Earnings available: ₹{earnings_available}")
    
    return {
        "month": current_month,
        "current_day": current_day,
        "advance": {
            "monthly_salary": round(monthly_salary, 2),
            "working_days": working_days,
            "working_days_passed": advance_info["working_days_passed"],
            "available": advance_info["available"],
            "earned_so_far": advance_info["earned_so_far"],
            "max_advance_30_percent": advance_info["max_advance"],
            "already_advanced": advance_info["already_advanced"]
        },
        "earnings": {
            "total_earnings": round(total_earnings, 2),
            "already_withdrawn": round(total_withdrawn, 2),
            "available": round(earnings_available, 2)
        }
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_money_request(
    request: MoneyRequestCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a new money request (advance or withdrawal)
    """
    db = get_database()
    current_month = datetime.utcnow().strftime("%Y-%m")
    
    # Get available balance
    balance_response = await get_available_balance(current_user)
    
    # Validate request based on type
    if request.request_type == "advance":
        available = balance_response["advance"]["available"]
        if request.amount > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested amount exceeds available advance. Available: ₹{available}"
            )
    elif request.request_type == "withdrawal":
        available = balance_response["earnings"]["available"]
        if request.amount > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested amount exceeds available earnings. Available: ₹{available}"
            )
    
    # Create request
    request_dict = request.dict()
    request_dict["user_id"] = str(current_user["_id"])
    request_dict["month"] = current_month
    request_dict["status"] = RequestStatus.PENDING
    request_dict["created_at"] = datetime.utcnow()
    request_dict["updated_at"] = datetime.utcnow()
    
    result = await db.money_requests.insert_one(request_dict)
    
    return {
        "message": "Money request submitted successfully",
        "request_id": str(result.inserted_id),
        "status": "pending"
    }


@router.get("/my-requests", response_model=List[dict])
async def get_my_requests(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get all money requests for current user
    """
    db = get_database()
    
    query = {"user_id": str(current_user["_id"])}
    if month:
        query["month"] = month
    
    requests = await db.money_requests.find(query).sort("created_at", -1).to_list(100)
    
    for req in requests:
        req["_id"] = str(req["_id"])
    
    return requests


@router.get("/admin/requests", response_model=List[dict])
async def get_all_requests(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Get all money requests
    """
    db = get_database()
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    requests = await db.money_requests.find(query).sort("created_at", -1).to_list(1000)
    
    # Get user info for each request
    user_ids = list(set([req["user_id"] for req in requests]))
    users = {}
    for user_id in user_ids:
        if ObjectId.is_valid(user_id):
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                users[user_id] = {
                    "full_name": user.get("full_name"),
                    "mobile_number": user.get("mobile_number")
                }
    
    for req in requests:
        req["_id"] = str(req["_id"])
        req["user_info"] = users.get(req["user_id"], {})
    
    return requests


@router.put("/admin/requests/{request_id}", response_model=dict)
async def update_request_status(
    request_id: str,
    update: MoneyRequestUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Admin: Update money request status
    """
    db = get_database()
    
    if not ObjectId.is_valid(request_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    # Check if request exists
    existing = await db.money_requests.find_one({"_id": ObjectId(request_id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    update_data = update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        if update.status and update.status != RequestStatus.PENDING:
            update_data["processed_by"] = str(current_user["_id"])
            update_data["processed_at"] = datetime.utcnow()
        
        await db.money_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
    
    return {"message": "Request updated successfully"}


@router.delete("/{request_id}", response_model=dict)
async def cancel_request(
    request_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    User can cancel their own pending request
    """
    db = get_database()
    
    if not ObjectId.is_valid(request_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    # Check if request exists and belongs to user
    existing = await db.money_requests.find_one({
        "_id": ObjectId(request_id),
        "user_id": str(current_user["_id"])
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Can only cancel pending requests
    if existing.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending requests"
        )
    
    result = await db.money_requests.delete_one({"_id": ObjectId(request_id)})
    
    return {"message": "Request cancelled successfully"}

