import { useState, useEffect } from "react";
import { X, UserPlus, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  onSuccess: () => void;
}

const AssignVehicleModal = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  onSuccess,
}: AssignVehicleModalProps) => {
  const { token } = useAuthStore();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    driver_id: "",
    assignment_type: "permanent",
    assigned_until: "",
    notes: "",
  });

  // Fetch drivers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";
      
      // Fetch all users
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for drivers (role = driver or spare_driver)
        const driverUsers = data.filter((user: any) => 
          user.role === "driver" || user.role === "spare_driver" || user.role === "user"
        );
        setDrivers(driverUsers);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError("Failed to load drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.driver_id) {
      setError("Please select a driver");
      return;
    }

    setLoading(true);

    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";

      // Prepare assignment data
      const assignmentData: any = {
        driver_id: formData.driver_id,
        assignment_type: formData.assignment_type,
      };

      if (formData.assigned_until) {
        assignmentData.assigned_until = new Date(formData.assigned_until).toISOString();
      }

      if (formData.notes) {
        assignmentData.notes = formData.notes;
      }

      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to assign vehicle");
      }

      setSuccess("Vehicle assigned successfully!");

      // Reset and close after brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          driver_id: "",
          assignment_type: "permanent",
          assigned_until: "",
          notes: "",
        });
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to assign vehicle");
    } finally {
      setLoading(false);
    }
  };

  const selectedDriver = drivers.find((d) => d.user_id === formData.driver_id || d.mobile_number === formData.driver_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
              Assign Vehicle to Driver
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

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Select Driver */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Driver <span className="text-red-500">*</span>
            </label>
            {loadingDrivers ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-600 mt-2">Loading drivers...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No drivers available. Please create driver accounts first.
                </p>
              </div>
            ) : (
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              >
                <option value="">Select a driver...</option>
                {drivers.map((driver) => (
                  <option key={driver.user_id || driver.mobile_number} value={driver.user_id || driver.mobile_number}>
                    {driver.full_name} - {driver.mobile_number} ({driver.role})
                  </option>
                ))}
              </select>
            )}

            {selectedDriver && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Selected Driver:</p>
                <p className="text-sm text-gray-700 mt-1">
                  {selectedDriver.full_name} • {selectedDriver.mobile_number}
                </p>
                {selectedDriver.driving_license_number && (
                  <p className="text-xs text-gray-500">DL: {selectedDriver.driving_license_number}</p>
                )}
              </div>
            )}
          </div>

          {/* Assignment Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assignment Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignment_type: "permanent", assigned_until: "" })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.assignment_type === "permanent"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold ${
                  formData.assignment_type === "permanent" ? "text-orange-900" : "text-gray-700"
                }`}>
                  Permanent
                </p>
                <p className="text-xs text-gray-500 mt-1">Long-term</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignment_type: "temporary" })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.assignment_type === "temporary"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold ${
                  formData.assignment_type === "temporary" ? "text-orange-900" : "text-gray-700"
                }`}>
                  Temporary
                </p>
                <p className="text-xs text-gray-500 mt-1">Short-term</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignment_type: "trip_specific", assigned_until: "" })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.assignment_type === "trip_specific"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold ${
                  formData.assignment_type === "trip_specific" ? "text-orange-900" : "text-gray-700"
                }`}>
                  Trip-Specific
                </p>
                <p className="text-xs text-gray-500 mt-1">One trip</p>
              </button>
            </div>
          </div>

          {/* Temporary Assignment End Date */}
          {formData.assignment_type === "temporary" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment End Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="datetime-local"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.assigned_until}
                  onChange={(e) => setFormData({ ...formData, assigned_until: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for indefinite temporary assignment
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Any additional notes about this assignment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 What Happens:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Vehicle status will be changed to "In Use"</li>
              <li>• Driver will see this vehicle in their dashboard</li>
              <li>• Driver can log charging sessions (if EV)</li>
              <li>• Driver can add expenses</li>
              <li>• Assignment history will be tracked</li>
              <li>• Current odometer and condition will be recorded</li>
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
              disabled={loading || drivers.length === 0}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignVehicleModal;

