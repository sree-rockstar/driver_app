import { useState, useEffect } from "react";
import { 
  X, Car, Battery, Fuel, MapPin, Calendar, User, 
  FileText, Image, Wrench, DollarSign, Zap, TrendingUp
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
}

const VehicleDetailsModal = ({ isOpen, onClose, vehicleId }: VehicleDetailsModalProps) => {
  const { token } = useAuthStore();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchVehicleDetails();
    }
  }, [isOpen, vehicleId]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicle(data.vehicle);
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-green-600";
    if (level >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryBgColor = (level: number) => {
    if (level >= 70) return "bg-green-100";
    if (level >= 30) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-6 h-6" />
              Vehicle Details
            </h2>
            {vehicle && (
              <p className="text-sm text-gray-600 mt-1">
                {vehicle.vehicle_id} • {vehicle.registration_number}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading vehicle details...</p>
          </div>
        ) : vehicle ? (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-4 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("basic")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "basic"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Basic Info
                  </div>
                </button>

                {vehicle.is_electric && (
                  <button
                    onClick={() => setActiveTab("battery")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "battery"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Battery & Charging
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("documents")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "documents"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("photos")}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "photos"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Photos
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  {/* Vehicle Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Make & Model</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Year</h3>
                      <p className="text-lg font-semibold text-gray-900">{vehicle.year}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Registration Number</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.registration_number}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle Type</h3>
                      <p className="text-lg font-semibold text-gray-900">{vehicle.vehicle_type}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Color</h3>
                      <p className="text-lg font-semibold text-gray-900">{vehicle.color}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Seating Capacity</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.seating_capacity} seats
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Fuel Type</h3>
                      <p className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2">
                        {vehicle.is_electric ? (
                          <>
                            <Zap className="w-5 h-5 text-purple-600" />
                            Electric
                          </>
                        ) : (
                          <>
                            <Fuel className="w-5 h-5 text-blue-600" />
                            {vehicle.fuel_type}
                          </>
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Odometer</h3>
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        {vehicle.odometer_reading.toLocaleString()} km
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {vehicle.status.replace("_", " ")}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Condition</h3>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {vehicle.condition.replace("_", " ")}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ownership</h3>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {vehicle.ownership_type}
                      </p>
                    </div>

                    {vehicle.current_driver_id && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Current Driver</h3>
                        <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          {vehicle.current_driver_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Battery & Charging Tab */}
              {activeTab === "battery" && vehicle.is_electric && vehicle.ev_details && (
                <div className="space-y-6">
                  {/* Battery Status */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Battery Status</h3>
                      <Battery className="w-8 h-8" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm opacity-90">Current Level</p>
                        <p className="text-3xl font-bold">
                          {vehicle.ev_details.current_battery_level}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Range Remaining</p>
                        <p className="text-3xl font-bold">
                          {vehicle.ev_details.current_range} km
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Battery Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Battery Capacity</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.ev_details.battery_capacity} kWh
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Range</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.ev_details.estimated_range} km
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Charging Type</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.ev_details.charging_type}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Max Charging Speed</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.ev_details.max_charging_speed} kW
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Battery Health</h3>
                      <p className="text-lg font-semibold text-green-600">
                        {vehicle.ev_details.battery_health}%
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Charging Cycles</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {vehicle.ev_details.charging_cycles}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Charging Status</h3>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {vehicle.ev_details.charging_status.replace("_", " ")}
                      </p>
                    </div>

                    {vehicle.ev_details.last_charged_at && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Last Charged</h3>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(vehicle.ev_details.last_charged_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Vehicle Documents
                  </h3>

                  {/* Document List */}
                  <div className="space-y-3">
                    <DocumentItem
                      name="Registration Certificate (RC)"
                      fileId={vehicle.documents?.registration_certificate}
                      expiryDate={vehicle.registration_expiry}
                      isMandatory
                    />
                    <DocumentItem
                      name="Insurance Policy"
                      fileId={vehicle.documents?.insurance}
                      expiryDate={vehicle.insurance_expiry}
                      isMandatory
                    />
                    <DocumentItem
                      name="Pollution Certificate (PUC)"
                      fileId={vehicle.documents?.pollution_certificate}
                      expiryDate={vehicle.pollution_expiry}
                    />
                    <DocumentItem
                      name="Fitness Certificate"
                      fileId={vehicle.documents?.fitness_certificate}
                      expiryDate={vehicle.fitness_expiry}
                    />
                    <DocumentItem
                      name="Permit"
                      fileId={vehicle.documents?.permit}
                      expiryDate={vehicle.permit_expiry}
                    />
                    <DocumentItem
                      name="Road Tax Receipt"
                      fileId={vehicle.documents?.road_tax_receipt}
                    />
                  </div>

                  <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    + Upload New Document
                  </button>
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === "photos" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Vehicle Photos
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <PhotoItem
                      name="Front View"
                      fileId={vehicle.photos?.front_view}
                      isMandatory
                    />
                    <PhotoItem
                      name="Back View"
                      fileId={vehicle.photos?.back_view}
                      isMandatory
                    />
                    <PhotoItem
                      name="Left Side"
                      fileId={vehicle.photos?.left_side}
                    />
                    <PhotoItem
                      name="Right Side"
                      fileId={vehicle.photos?.right_side}
                    />
                    <PhotoItem
                      name="Interior"
                      fileId={vehicle.photos?.interior}
                    />
                    <PhotoItem
                      name="RC Photo"
                      fileId={vehicle.photos?.rc_photo}
                    />
                  </div>

                  <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    + Upload New Photo
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">Vehicle not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Document Item Component
const DocumentItem = ({ name, fileId, expiryDate, isMandatory = false }: any) => {
  const hasDocument = !!fileId;
  const isExpired = expiryDate && new Date(expiryDate) < new Date();
  const expiringIn = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = expiringIn !== null && expiringIn <= 30 && expiringIn > 0;

  return (
    <div className={`p-4 rounded-lg border-2 ${
      !hasDocument && isMandatory
        ? "border-red-200 bg-red-50"
        : isExpired
        ? "border-red-300 bg-red-50"
        : isExpiringSoon
        ? "border-yellow-300 bg-yellow-50"
        : hasDocument
        ? "border-green-200 bg-green-50"
        : "border-gray-200 bg-gray-50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-900 flex items-center gap-2">
            {name}
            {isMandatory && <span className="text-red-500 text-xs">(MANDATORY)</span>}
          </p>
          {hasDocument ? (
            <div className="mt-1">
              <p className="text-sm text-green-600 font-medium">✓ Uploaded</p>
              {expiryDate && (
                <p className={`text-xs mt-1 ${
                  isExpired ? "text-red-600 font-semibold" : 
                  isExpiringSoon ? "text-yellow-600 font-semibold" : 
                  "text-gray-500"
                }`}>
                  {isExpired 
                    ? `⚠️ Expired on ${new Date(expiryDate).toLocaleDateString()}`
                    : isExpiringSoon
                    ? `⚠️ Expires in ${expiringIn} days`
                    : `Expires: ${new Date(expiryDate).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              {isMandatory ? "❌ Not uploaded (Required)" : "Not uploaded"}
            </p>
          )}
        </div>
        {hasDocument && (
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            View
          </button>
        )}
      </div>
    </div>
  );
};

// Photo Item Component
const PhotoItem = ({ name, fileId, isMandatory = false }: any) => {
  const hasPhoto = !!fileId;

  return (
    <div className={`p-4 rounded-lg border-2 text-center ${
      !hasPhoto && isMandatory
        ? "border-red-200 bg-red-50"
        : hasPhoto
        ? "border-green-200 bg-green-50"
        : "border-gray-200 bg-gray-50"
    }`}>
      <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
        {hasPhoto ? (
          <Image className="w-8 h-8 text-gray-400" />
        ) : (
          <Image className="w-8 h-8 text-gray-300" />
        )}
      </div>
      <p className="font-medium text-gray-900 text-sm">{name}</p>
      {isMandatory && <p className="text-xs text-red-500 mt-1">(MANDATORY)</p>}
      {hasPhoto ? (
        <p className="text-xs text-green-600 font-medium mt-1">✓ Uploaded</p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Not uploaded</p>
      )}
    </div>
  );
};

export default VehicleDetailsModal;

