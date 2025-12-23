from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class FileDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # Reference to user who uploaded
    file_type: str  # "driving_license_front", "driving_license_back", "aadhar_front", "aadhar_back"
    file_path: str  # Path to the file on disk
    original_filename: str  # Original filename from upload
    mime_type: str  # File MIME type
    file_size: int  # Size in bytes
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, deleted, replaced
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "file_type": "driving_license_front",
                "file_path": "uploads/driving_licenses/862755a2-65c9-4140-b81c-8bc8bc61f254.png",
                "original_filename": "dl_front.png",
                "mime_type": "image/png",
                "file_size": 1024000,
                "status": "active"
            }
        }


class FileInDB(FileDocument):
    pass

