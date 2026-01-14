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


class RequestType(str, Enum):
    ADVANCE = "advance"
    WITHDRAWAL = "withdrawal"


class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class MoneyRequestBase(BaseModel):
    request_type: RequestType = Field(..., description="Type: 'advance' or 'withdrawal'")
    amount: float = Field(..., gt=0, description="Requested amount")
    reason: Optional[str] = Field(None, description="Reason for request")
    status: RequestStatus = Field(default=RequestStatus.PENDING, description="Request status")


class MoneyRequestCreate(BaseModel):
    request_type: RequestType
    amount: float = Field(..., gt=0)
    reason: Optional[str] = None


class MoneyRequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    admin_notes: Optional[str] = None


class MoneyRequestInDB(MoneyRequestBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="ID of the user who made the request")
    month: str = Field(..., description="Month of request in YYYY-MM format")
    admin_notes: Optional[str] = None
    processed_by: Optional[str] = Field(None, description="Admin who processed the request")
    processed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MoneyRequest(MoneyRequestInDB):
    pass

