from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    DRIVER = "driver"


class DocumentImages(BaseModel):
    """References to file IDs in the files collection"""
    driving_license_front: Optional[str] = None  # File ID reference
    driving_license_back: Optional[str] = None   # File ID reference
    aadhar_front: Optional[str] = None           # File ID reference
    aadhar_back: Optional[str] = None            # File ID reference


class UserBase(BaseModel):
    mobile_number: str
    full_name: str
    email: Optional[EmailStr] = None
    driving_license_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    role: UserRole = UserRole.DRIVER
    status: str = "registered"  # Status code from UserStatus collection
    is_verified: bool = False
    documents: Optional[DocumentImages] = None
    has_mpin: bool = False
    monthly_salary: Optional[float] = Field(None, ge=0, description="Monthly salary in currency")
    working_days: Optional[int] = Field(None, ge=1, le=31, description="Number of working days in month")


class UserCreate(BaseModel):
    mobile_number: str
    full_name: str
    password: str
    email: Optional[EmailStr] = None
    driving_license_number: Optional[str] = None
    aadhar_number: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    driving_license_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    status: Optional[str] = None
    monthly_salary: Optional[float] = Field(None, ge=0, description="Monthly salary in currency")
    working_days: Optional[int] = Field(None, ge=1, le=31, description="Number of working days in month")


class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class UserWithToken(BaseModel):
    user: User
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


