import { useState } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface DocumentUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  onSuccess: () => void;
}

interface DocumentType {
  key: string;
  label: string;
  isMandatory: boolean;
  hasExpiry: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { key: "rc", label: "Registration Certificate (RC)", isMandatory: true, hasExpiry: true },
  { key: "insurance", label: "Insurance Policy", isMandatory: true, hasExpiry: true },
  { key: "pollution", label: "Pollution Certificate (PUC)", isMandatory: false, hasExpiry: true },
  { key: "fitness", label: "Fitness Certificate", isMandatory: false, hasExpiry: true },
  { key: "permit", label: "Commercial Permit", isMandatory: false, hasExpiry: true },
  { key: "road_tax", label: "Road Tax Receipt", isMandatory: false, hasExpiry: false },
];

const DocumentUploader = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  onSuccess,
}: DocumentUploaderProps) => {
  const { token } = useAuthStore();
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        setSelectedFile(null);
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPG, and PNG files are allowed");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (selectedDocType.hasExpiry && !expiryDate) {
      setError("Please enter the expiry date for this document");
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
      formData.append("document_type", selectedDocType.key);
      if (expiryDate) {
        formData.append("expiry_date", expiryDate);
      }

      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to upload document");
      }

      setSuccess(`✅ ${selectedDocType.label} uploaded successfully!`);
      
      // Mark this document type as uploaded
      setUploadedDocs(prev => new Set(prev).add(selectedDocType.key));
      
      // Reset form but keep uploaded state
      setSelectedFile(null);
      setExpiryDate("");
      
      // Call success callback
      onSuccess();
      
      // Auto-close after showing success message
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Upload Vehicle Document
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
                <p className="text-xs text-green-700 mt-1">Document saved and vehicle updated</p>
              </div>
            </div>
          )}

          {/* Document Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DOCUMENT_TYPES.map((docType) => {
                const isUploaded = uploadedDocs.has(docType.key);
                const isSelected = selectedDocType.key === docType.key;
                
                return (
                  <button
                    key={docType.key}
                    type="button"
                    onClick={() => {
                      setSelectedDocType(docType);
                      setExpiryDate("");
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all relative ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : isUploaded
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isSelected ? "text-indigo-900" : 
                          isUploaded ? "text-green-900" :
                          "text-gray-900"
                        }`}>
                          {docType.label}
                        </p>
                        {docType.isMandatory && (
                          <p className="text-xs text-red-500 mt-1">MANDATORY</p>
                        )}
                        {docType.hasExpiry && (
                          <p className="text-xs text-gray-500 mt-1">Requires expiry date</p>
                        )}
                        {isUploaded && (
                          <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Uploaded
                          </p>
                        )}
                      </div>
                      {isSelected && !isUploaded && (
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      )}
                      {isUploaded && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <label className="cursor-pointer">
                <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF, JPG, or PNG (Max 5MB)
              </p>
            </div>

            {selectedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                    <p className="text-xs text-green-700">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expiry Date */}
          {selectedDocType.hasExpiry && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                System will alert you 30/15/7 days before expiry
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📝 Document Guidelines:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Document must be clear and readable</li>
              <li>• All text should be visible</li>
              <li>• PDF format preferred for certificates</li>
              <li>• JPG/PNG accepted for scanned documents</li>
              <li>• Maximum file size: 5MB</li>
              {selectedDocType.isMandatory && (
                <li className="text-red-600 font-semibold">• This document is MANDATORY before vehicle activation</li>
              )}
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
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploader;

