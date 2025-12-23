import { useState } from "react";
import { X, Car, Zap, Fuel } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddVehicleModal = ({ isOpen, onClose, onSuccess }: AddVehicleModalProps) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isElectric, setIsElectric] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    registration_number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vehicle_type: "SUV",
    seating_capacity: 5,
    fuel_type: "diesel",
    odometer_reading: 0,
    ownership_type: "owned",
    // EV specific
    battery_capacity: 60,
    estimated_range: 340,
    charging_type: "AC+DC",
    max_charging_speed: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

      // Prepare vehicle data
      const vehicleData: any = {
        vehicle_id: formData.vehicle_id,
        registration_number: formData.registration_number.toUpperCase(),
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        vehicle_type: formData.vehicle_type,
        seating_capacity: formData.seating_capacity,
        fuel_type: isElectric ? "electric" : formData.fuel_type,
        is_electric: isElectric,
        odometer_reading: formData.odometer_reading,
        ownership_type: formData.ownership_type,
        status: "available",
        condition: "excellent",
        documents: {},
        photos: {},
      };

      // Add EV details if electric
      if (isElectric) {
        vehicleData.ev_details = {
          battery_capacity: formData.battery_capacity,
          current_battery_level: 100,
          estimated_range: formData.estimated_range,
          current_range: formData.estimated_range,
          charging_type: formData.charging_type,
          max_charging_speed: formData.max_charging_speed,
          charging_status: "not_charging",
          battery_health: 100,
          charging_cycles: 0,
          home_charging_available: false,
        };
      }

      const response = await fetch(`${API_URL}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create vehicle");
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        vehicle_id: "",
        registration_number: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        vehicle_type: "SUV",
        seating_capacity: 5,
        fuel_type: "diesel",
        odometer_reading: 0,
        ownership_type: "owned",
        battery_capacity: 60,
        estimated_range: 340,
        charging_type: "AC+DC",
        max_charging_speed: 50,
      });
      setIsElectric(false);
    } catch (err: any) {
      setError(err.message || "Failed to create vehicle");
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6" />
            Add New Vehicle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Vehicle Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsElectric(false)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !isElectric
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Fuel className={`w-8 h-8 mx-auto mb-2 ${!isElectric ? "text-blue-600" : "text-gray-400"}`} />
                <p className={`font-semibold ${!isElectric ? "text-blue-900" : "text-gray-700"}`}>
                  Fuel Vehicle
                </p>
                <p className="text-xs text-gray-500 mt-1">Petrol, Diesel, CNG</p>
              </button>

              <button
                type="button"
                onClick={() => setIsElectric(true)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  isElectric
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Zap className={`w-8 h-8 mx-auto mb-2 ${isElectric ? "text-purple-600" : "text-gray-400"}`} />
                <p className={`font-semibold ${isElectric ? "text-purple-900" : "text-gray-700"}`}>
                  Electric Vehicle
                </p>
                <p className="text-xs text-gray-500 mt-1">Battery powered</p>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VEH001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="KA01AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Toyota"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Innova Crysta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="White"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seating Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.seating_capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, seating_capacity: parseInt(e.target.value) })
                  }
                />
              </div>

              {!isElectric && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Odometer (km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.odometer_reading}
                  onChange={(e) =>
                    setFormData({ ...formData, odometer_reading: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* EV Specific Fields */}
          {isElectric && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Electric Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Battery Capacity (kWh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="200"
                    step="0.1"
                    placeholder="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.battery_capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, battery_capacity: parseFloat(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Range (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="1000"
                    placeholder="340"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.estimated_range}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_range: parseFloat(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Charging Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.charging_type}
                    onChange={(e) => setFormData({ ...formData, charging_type: e.target.value })}
                  >
                    <option value="AC">AC Only</option>
                    <option value="DC">DC Only</option>
                    <option value="AC+DC">AC + DC (Both)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Charging Speed (kW) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="3"
                    max="350"
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.max_charging_speed}
                    onChange={(e) =>
                      setFormData({ ...formData, max_charging_speed: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <p className="text-sm text-purple-800">
                  ℹ️ These values can be found in the vehicle's specifications or manual. You can
                  update them later if needed.
                </p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ownership Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.ownership_type}
                  onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                >
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Next Steps After Creation:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload vehicle documents (RC, Insurance, PUC)</li>
              <li>• Upload vehicle photos (Front, Back, Sides, Interior)</li>
              <li>• Assign vehicle to a driver</li>
              <li>• Set up maintenance schedule</li>
              {isElectric && <li>• Configure charging preferences</li>}
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
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Car className="w-4 h-4" />
                  Create Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal;

