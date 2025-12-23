from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token
from app.db.mongodb import get_database
from app.models.user import UserRole
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    print(f"[DEBUG] Token received: {token[:50]}...")
    
    payload = decode_access_token(token)
    print(f"[DEBUG] Decoded payload: {payload}")
    
    if payload is None:
        print("[DEBUG] Payload is None - token decode failed")
        raise credentials_exception
    
    mobile_number: str = payload.get("sub")
    print(f"[DEBUG] Mobile number from token: {mobile_number}")
    
    if mobile_number is None:
        print("[DEBUG] Mobile number is None")
        raise credentials_exception
    
    db = get_database()
    user = await db.users.find_one({"mobile_number": mobile_number})
    print(f"[DEBUG] User found: {user is not None}")
    
    if user is None:
        print(f"[DEBUG] No user found with mobile: {mobile_number}")
        raise credentials_exception
    
    print(f"[DEBUG] User authenticated: {user.get('full_name')}")
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user"""
    # Check if user status allows access
    user_status = current_user.get("status", "registered")
    
    if user_status in ["deactivated"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
    
    if user_status in ["inactive"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    return current_user


async def get_current_admin_user(current_user: dict = Depends(get_current_active_user)):
    """Get current admin user"""
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


