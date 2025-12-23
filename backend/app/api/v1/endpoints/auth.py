from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.file_upload import save_upload_file
from app.db.mongodb import get_database
from app.models.user import Token, UserCreate, User, UserRole, DocumentImages, UserWithToken
from app.models.file import FileDocument
from datetime import datetime
from bson import ObjectId
import os

router = APIRouter()


@router.post("/register", response_model=UserWithToken)
async def register(
    mobile_number: str = Form(...),
    full_name: str = Form(...),
    password: Optional[str] = Form(None),
    driving_license_number: Optional[str] = Form(None),
    aadhar_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    dl_front: Optional[UploadFile] = File(None),
    dl_back: Optional[UploadFile] = File(None),
    aadhar_front: Optional[UploadFile] = File(None),
    aadhar_back: Optional[UploadFile] = File(None),
):
    """Register a new user/driver with document uploads"""
    db = get_database()
    
    # Validate mobile number format (basic validation)
    if not mobile_number.isdigit() or len(mobile_number) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number format"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"mobile_number": mobile_number})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered"
        )
    
    # Helper function to create file document
    async def create_file_document(file: UploadFile, file_type: str, category: str, user_id: str):
        """Save file and create file document in files collection"""
        # Read file to get size
        contents = await file.read()
        await file.seek(0)  # Reset file pointer for save_upload_file
        
        file_path = await save_upload_file(file, category)
        
        file_doc = {
            "user_id": user_id,
            "file_type": file_type,
            "file_path": file_path,
            "original_filename": file.filename,
            "mime_type": file.content_type or "application/octet-stream",
            "file_size": len(contents),  # Actual file size in bytes
            "uploaded_at": datetime.utcnow(),
            "status": "active"
        }
        
        result = await db.files.insert_one(file_doc)
        return str(result.inserted_id)
    
    # We'll store file IDs temporarily, then create files after user is created
    file_uploads = {}
    if dl_front:
        file_uploads['driving_license_front'] = ('driving_license_front', dl_front, 'driving_licenses')
    if dl_back:
        file_uploads['driving_license_back'] = ('driving_license_back', dl_back, 'driving_licenses')
    if aadhar_front:
        file_uploads['aadhar_front'] = ('aadhar_front', aadhar_front, 'aadhar')
    if aadhar_back:
        file_uploads['aadhar_back'] = ('aadhar_back', aadhar_back, 'aadhar')
    
    # Create new user first
    user_dict = {
        "mobile_number": mobile_number,
        "full_name": full_name,
        "email": email,
        "driving_license_number": driving_license_number,
        "aadhar_number": aadhar_number,
        "hashed_password": get_password_hash(password) if password else None,
        "role": UserRole.DRIVER,
        "status": "registered",  # Initial status
        "is_verified": False,
        "has_mpin": False,
        "documents": None,  # Will update after uploading files
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Now upload files and create file documents with user_id
    documents = DocumentImages()
    for field_name, (file_type, file, category) in file_uploads.items():
        file_id = await create_file_document(file, file_type, category, user_id)
        setattr(documents, field_name, file_id)
    
    # Update user with document file IDs
    if file_uploads:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"documents": documents.model_dump()}}
        )
    
    created_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    created_user["id"] = str(created_user.pop("_id"))
    user_obj = User(**created_user)
    
    # Create access token for the newly registered user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.mobile_number, "role": user_obj.role},
        expires_delta=access_token_expires
    )
    
    return UserWithToken(
        user=user_obj,
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/login", response_model=Token)
async def login(
    mobile_number: str = Form(...),
    mpin: str = Form(...)
):
    """Login with mobile number and MPIN"""
    db = get_database()
    
    # Validate mobile number format
    if not mobile_number.isdigit() or len(mobile_number) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number format"
        )
    
    # Find user by mobile number
    user = await db.users.find_one({"mobile_number": mobile_number})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mobile number not registered",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user has set MPIN
    if not user.get("has_mpin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPIN not set. Please complete registration."
        )
    
    # Verify MPIN
    if not verify_password(mpin, user.get("mpin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect MPIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user status allows login
    user_status = user.get("status", "registered")
    if user_status in ["deactivated"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact support."
        )
    
    if user_status in ["inactive"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact support."
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["mobile_number"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/check-mobile")
async def check_mobile(mobile_number: str = Form(...)):
    """Check if mobile number exists and has MPIN set"""
    db = get_database()
    
    # Validate mobile number format
    if not mobile_number.isdigit() or len(mobile_number) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number format"
        )
    
    # Find user by mobile number
    user = await db.users.find_one({"mobile_number": mobile_number})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number not registered"
        )
    
    # Check status
    user_status = user.get("status", "registered")
    if user_status in ["deactivated", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active. Please contact support."
        )
    
    return {
        "mobile_number": mobile_number,
        "has_mpin": user.get("has_mpin", False),
        "full_name": user.get("full_name"),
        "status": user_status
    }


