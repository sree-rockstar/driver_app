import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def validate_image(file: UploadFile) -> bool:
    """Validate if the uploaded file is a valid image"""
    try:
        contents = await file.read()
        await file.seek(0)  # Reset file pointer
        
        # Check file size
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB")
        
        # Validate image
        image = Image.open(io.BytesIO(contents))
        image.verify()
        
        # Check extension
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        return True
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")


async def save_upload_file(file: UploadFile, subfolder: str = "documents") -> str:
    """Save uploaded file and return the file path"""
    await validate_image(file)
    
    # Create subfolder
    folder = UPLOAD_DIR / subfolder
    folder.mkdir(exist_ok=True)
    
    # Generate unique filename
    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = folder / unique_filename
    
    # Save file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return relative path
    return f"uploads/{subfolder}/{unique_filename}"


async def delete_file(file_path: str) -> bool:
    """Delete a file from the uploads directory"""
    try:
        full_path = Path(file_path)
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception:
        return False


def get_file_url(file_path: str, base_url: str) -> str:
    """Convert file path to URL"""
    return f"{base_url}/{file_path}"

