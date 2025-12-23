from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoleCode(str, Enum):
    """Role codes for the system"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    OPERATOR = "operator"
    ACCOUNTANT = "accountant"
    HR_STAFF = "hr_staff"
    SUPPORT_STAFF = "support_staff"
    DRIVER = "driver"
    SPARE_DRIVER = "spare_driver"
    USER = "user"


class RolePermissions(BaseModel):
    """Permissions for a role"""
    # User Management
    manage_users: bool = False
    view_users: bool = False
    
    # Driver Management
    approve_drivers: bool = False
    manage_drivers: bool = False
    view_drivers: bool = False
    
    # Trip Management
    create_trips: bool = False
    assign_trips: bool = False
    manage_trips: bool = False
    view_trips: bool = False
    
    # Financial
    manage_payments: bool = False
    view_payments: bool = False
    generate_invoices: bool = False
    
    # Reports
    view_reports: bool = False
    export_reports: bool = False
    
    # System
    system_config: bool = False
    manage_roles: bool = False
    
    # Documents
    verify_documents: bool = False
    view_documents: bool = False


class Role(BaseModel):
    """Role model"""
    name: str
    code: RoleCode
    description: str
    permissions: RolePermissions
    color: str  # For UI display
    tier: int  # 1=System, 2=Management, 3=Operations, 4=Support, 5=External
    is_active: bool = True
    is_backend_role: bool = True  # True for office roles, False for field roles
    created_at: datetime
    updated_at: datetime


class RoleInDB(Role):
    id: str
    
    class Config:
        from_attributes = True


