import { useState } from "react";
import { X, Upload, Image, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface PhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  onSuccess: () => void;
}

interface PhotoType {
  key: string;
  label: string;
  isMandatory: boolean;
  description: string;
}

const PHOTO_TYPES: PhotoType[] = [
  { key: "front", label: "Front View", isMandatory: true, description: "Full front view with number plate visible" },
  { key: "back", label: "Back View", isMandatory: true, description: "Full back view with number plate visible" },
  { key: "left", label: "Left Side", isMandatory: false, description: "Full left side profile" },
  { key: "right", label: "Right Side", isMandatory: false, description: "Full right side profile" },
  { key: "interior", label: "Interior/Dashboard", isMandatory: false, description: "Dashboard with odometer visible" },
  { key: "rc_photo", label: "RC Book Photo", isMandatory: false, description: "Physical RC book" },
  { key: "insurance_sticker", label: "Insurance Sticker", isMandatory: false, description: "Insurance sticker on windshield" },
];

const PhotoGallery = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  onSuccess,
}: PhotoGalleryProps) => {
  const { token } = useAuthStore();
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>(PHOTO_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<Set<string>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (2MB max for photos)
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be less than 2MB");
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }

      // Validate file type (images only)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG and PNG images are allowed");
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }

      setSelectedFile(file);
      setError("");
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a photo to upload");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
      
      // Create form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("photo_type", selectedPhotoType.key);

      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/photos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to upload photo");
      }

      setSuccess(`✅ ${selectedPhotoType.label} uploaded successfully!`);
      
      // Mark this photo type as uploaded
      setUploadedPhotos(prev => new Set(prev).add(selectedPhotoType.key));
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl("");
      
      // Call success callback
      onSuccess();
      
      // Auto-close after showing success
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-6 h-6 text-indigo-600" />
              Upload Vehicle Photo
            </h2>
            <p className="text-sm text-gray-600 mt-1">{vehicleName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 animate-pulse">
              <div className="bg-green-500 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-green-900 font-semibold">{success}</p>
                <p className="text-xs text-green-700 mt-1">Photo saved to vehicle gallery</p>
              </div>
            </div>
          )}

          {/* Photo Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Photo Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PHOTO_TYPES.map((photoType) => {
                const isUploaded = uploadedPhotos.has(photoType.key);
                const isSelected = selectedPhotoType.key === photoType.key;
                
                return (
                  <button
                    key={photoType.key}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoType(photoType);
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all relative ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : isUploaded
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className={`w-4 h-4 ${
                        isSelected ? "text-indigo-600" : 
                        isUploaded ? "text-green-600" :
                        "text-gray-400"
                      }`} />
                      <p className={`text-sm font-medium ${
                        isSelected ? "text-indigo-900" : 
                        isUploaded ? "text-green-900" :
                        "text-gray-900"
                      }`}>
                        {photoType.label}
                      </p>
                    </div>
                    {photoType.isMandatory && !isUploaded && (
                      <p className="text-xs text-red-500">REQUIRED</p>
                    )}
                    {isUploaded && (
                      <>
                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Uploaded
                        </p>
                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Photo Type Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {selectedPhotoType.label}
            </p>
            <p className="text-xs text-gray-600">{selectedPhotoType.description}</p>
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photo <span className="text-red-500">*</span>
            </label>
            
            {previewUrl ? (
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg bg-white mb-3"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">{selectedFile?.name}</p>
                    <p className="text-xs text-green-700">
                      {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-indigo-600 hover:text-indigo-700 font-medium text-lg">
                    Click to upload photo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG or PNG (Max 2MB)
                </p>
              </div>
            )}
          </div>

          {/* Photo Guidelines */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2 text-sm">📸 Photo Guidelines:</h4>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Take photo in good lighting</li>
              <li>• Full vehicle should be in frame</li>
              <li>• Number plate should be clearly visible</li>
              <li>• Avoid blurry or dark photos</li>
              <li>• Photo should be recent</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoGallery;

