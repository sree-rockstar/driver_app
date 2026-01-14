from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


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


class PaymentMethodBase(BaseModel):
    name: str = Field(..., description="Payment method name (e.g., Cash, Credit, UPI)")
    is_active: bool = Field(default=True, description="Whether this payment method is active")


class PaymentMethodCreate(PaymentMethodBase):
    pass


class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class PaymentMethodInDB(PaymentMethodBase):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PaymentMethod(PaymentMethodInDB):
    pass

