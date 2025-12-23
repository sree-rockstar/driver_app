from typing import Optional
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


class CommissionType(str, Enum):
    AMOUNT = "amount"
    PERCENTAGE = "percentage"


class TripTypeBase(BaseModel):
    name: str = Field(..., description="Trip type name (e.g., Quick Ride, Ola, Uber)")
    is_active: bool = Field(default=True, description="Whether this trip type is active")
    commission_type: Optional[CommissionType] = Field(None, description="Commission type: 'amount' or 'percentage'")
    commission_value: Optional[float] = Field(None, ge=0, description="Commission value (flat amount or percentage)")


class TripTypeCreate(TripTypeBase):
    pass


class TripTypeUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    commission_type: Optional[CommissionType] = None
    commission_value: Optional[float] = Field(None, ge=0)


class TripTypeInDB(TripTypeBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class TripType(TripTypeInDB):
    pass

