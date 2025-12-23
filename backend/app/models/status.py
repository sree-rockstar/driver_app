from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserStatusBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    color: str = "#6B7280"  # Default gray color
    is_active: bool = True
    order: int = 0


class UserStatusCreate(UserStatusBase):
    pass


class UserStatusUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class UserStatus(UserStatusBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Predefined status codes
class StatusCode:
    REGISTERED = "registered"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEACTIVATED = "deactivated"

