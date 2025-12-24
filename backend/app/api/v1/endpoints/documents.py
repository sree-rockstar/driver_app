from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.db.mongodb import get_database
from app.api.deps import get_current_user
from bson import ObjectId
import os

router = APIRouter()


@router.get("/file/{file_id}")
async def get_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a file by ID - returns the actual raw file for display
    
    This endpoint serves files in their original format (images, PDFs, etc.)
    so they can be displayed directly in browsers using <img> tags or PDF viewers.
    
    Security: Users can only access their own files, admins can access all files.
    """
    db = get_database()
    
    # Try to find file - support both MongoDB ObjectId and legacy UUID format
    file_doc = None
    
    # First, try as MongoDB ObjectId (new format)
    if ObjectId.is_valid(file_id):
        file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
    
    # If not found, try as legacy file_id (UUID string format)
    if not file_doc:
        file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get current user ID
    current_user_id = str(current_user.get("_id"))
    user_role = current_user.get("role")
    
    # Check if user has permission to access this file
    # Users can access their own files
    # Admins and super_admins can access all files (including vehicle files)
    # Drivers can access files for their assigned vehicles
    is_user_file = file_doc.get("user_id") == current_user_id
    is_vehicle_file = file_doc.get("vehicle_id") is not None
    is_admin = user_role in ["admin", "super_admin", "manager"]
    
    # Check if user has access
    if is_user_file or is_admin:
        # User owns the file or user is admin - allow access
        pass
    elif is_vehicle_file:
        # This is a vehicle file, check if driver has access to this vehicle
        vehicle_id = file_doc.get("vehicle_id")
        if vehicle_id:
            vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id})
            if vehicle and vehicle.get("current_driver_id") == current_user_id:
                # Driver is assigned to this vehicle - allow access
                pass
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to access this file"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this file"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file"
        )
    
    # Check if file is active
    if file_doc.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File is no longer available"
        )
    
    # Check if file exists on disk
    file_path = file_doc.get("file_path")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Return the raw file for display in browser
    # The media_type ensures browsers display it correctly (images show inline, not download)
    return FileResponse(
        path=file_path,
        media_type=file_doc.get("mime_type", "image/png"),
        headers={
            "Content-Disposition": f'inline; filename="{file_doc.get("original_filename", "file")}"',
            "Cache-Control": "public, max-age=31536000"  # Cache for 1 year
        }
    )


@router.get("/file/{file_id}/info")
async def get_file_info(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get file metadata by ID"""
    db = get_database()
    
    # Try to find file - support both MongoDB ObjectId and legacy UUID format
    file_doc = None
    
    # First, try as MongoDB ObjectId (new format)
    if ObjectId.is_valid(file_id):
        file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
    
    # If not found, try as legacy file_id (UUID string format)
    if not file_doc:
        file_doc = await db.files.find_one({"file_id": file_id})
    
    if not file_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get current user ID
    current_user_id = str(current_user.get("_id"))
    
    # Check if user has permission to access this file
    if file_doc.get("user_id") != current_user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file"
        )
    
    # Return file metadata
    file_doc["id"] = str(file_doc.pop("_id"))
    return file_doc


@router.get("/my-documents")
async def get_my_documents(
    current_user: dict = Depends(get_current_user)
):
    """Get all files for the current user with full file paths"""
    db = get_database()
    
    # Get user to fetch document references
    user = await db.users.find_one({"_id": current_user.get("_id")})
    
    if not user or not user.get("documents"):
        return {"documents": {}}
    
    documents = user.get("documents", {})
    result = {}
    
    # For each document reference, get the file path
    for doc_type, file_id in documents.items():
        if file_id and ObjectId.is_valid(file_id):
            file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
            if file_doc:
                # Return relative path (frontend baseURL already includes /api/v1)
                result[doc_type] = f"/documents/file/{file_id}"
    
    return {"documents": result}
