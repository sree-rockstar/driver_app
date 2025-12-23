from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from ....db.mongodb import get_database
from ....models.payment_method import PaymentMethod, PaymentMethodCreate, PaymentMethodUpdate
from ...deps import get_current_admin_user

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_method: PaymentMethodCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new payment method (Admin only).
    """
    db = get_database()
    
    # Check if payment method with same name already exists
    existing = await db.payment_methods.find_one({"name": payment_method.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment method with this name already exists"
        )
    
    payment_method_dict = payment_method.dict()
    payment_method_dict["created_at"] = datetime.utcnow()
    payment_method_dict["updated_at"] = datetime.utcnow()
    
    result = await db.payment_methods.insert_one(payment_method_dict)
    
    return {
        "message": "Payment method created successfully",
        "id": str(result.inserted_id)
    }


@router.get("/", response_model=List[dict])
async def get_payment_methods(
    include_inactive: bool = False
):
    """
    Get all payment methods. By default, only returns active ones.
    """
    db = get_database()
    
    query = {} if include_inactive else {"is_active": True}
    
    payment_methods = await db.payment_methods.find(query).sort("name", 1).to_list(100)
    
    # Convert ObjectId to string
    for payment_method in payment_methods:
        payment_method["_id"] = str(payment_method["_id"])
    
    return payment_methods


@router.get("/{payment_method_id}", response_model=dict)
async def get_payment_method(
    payment_method_id: str
):
    """
    Get a specific payment method by ID.
    """
    db = get_database()
    
    if not ObjectId.is_valid(payment_method_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method ID"
        )
    
    payment_method = await db.payment_methods.find_one({"_id": ObjectId(payment_method_id)})
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    payment_method["_id"] = str(payment_method["_id"])
    return payment_method


@router.put("/{payment_method_id}", response_model=dict)
async def update_payment_method(
    payment_method_id: str,
    payment_method_update: PaymentMethodUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Update a payment method (Admin only).
    """
    db = get_database()
    
    if not ObjectId.is_valid(payment_method_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method ID"
        )
    
    # Check if payment method exists
    existing = await db.payment_methods.find_one({"_id": ObjectId(payment_method_id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Check if name is being changed and if it conflicts
    if payment_method_update.name and payment_method_update.name != existing["name"]:
        name_exists = await db.payment_methods.find_one({
            "name": payment_method_update.name,
            "_id": {"$ne": ObjectId(payment_method_id)}
        })
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment method with this name already exists"
            )
    
    update_data = payment_method_update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.payment_methods.update_one(
            {"_id": ObjectId(payment_method_id)},
            {"$set": update_data}
        )
    
    return {"message": "Payment method updated successfully"}


@router.delete("/{payment_method_id}", response_model=dict)
async def delete_payment_method(
    payment_method_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Delete a payment method (Admin only).
    """
    db = get_database()
    
    if not ObjectId.is_valid(payment_method_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method ID"
        )
    
    result = await db.payment_methods.delete_one({"_id": ObjectId(payment_method_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    return {"message": "Payment method deleted successfully"}

