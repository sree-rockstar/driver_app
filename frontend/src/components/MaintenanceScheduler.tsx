import { useState } from "react";
import { X, Wrench, Calendar, DollarSign, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface MaintenanceSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  currentOdometer: number;
  onSuccess: () => void;
}

const MAINTENANCE_TYPES = [
  { value: "routine_service", label: "Routine Service", icon: "🔧", priority: "medium" },
  { value: "oil_change", label: "Oil Change", icon: "🛢️", priority: "medium" },
  { value: "tire_change", label: "Tire Change", icon: "🛞", priority: "high" },
  { value: "brake_service", label: "Brake Service", icon: "🛑", priority: "critical" },
  { value: "battery_check", label: "Battery Check", icon: "🔋", priority: "high" },
  { value: "repair", label: "Repair", icon: "🔨", priority: "high" },
  { value: "inspection", label: "Inspection", icon: "🔍", priority: "medium" },
  { value: "cleaning", label: "Cleaning", icon: "🧼", priority: "low" },
  { value: "other", label: "Other", icon: "📝", priority: "medium" },
];

const MaintenanceScheduler = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  currentOdometer,
  onSuccess,
}: MaintenanceSchedulerProps) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    maintenance_type: "routine_service",
    description: "",
    scheduled_date: "",
    service_provider: "",
    cost: "",
    odometer_reading: currentOdometer.toString(),
    next_service_km: "",
    parts_replaced: "",
    notes: "",
    vehicle_unavailable_from: "",
    vehicle_unavailable_until: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

      // Prepare maintenance data
      const maintenanceData: any = {
        vehicle_id: vehicleId,
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        status: "scheduled",
      };

      // Add optional fields if provided
      if (formData.service_provider) {
        maintenanceData.service_provider = formData.service_provider;
      }
      if (formData.cost) {
        maintenanceData.cost = parseFloat(formData.cost);
      }
      if (formData.odometer_reading) {
        maintenanceData.odometer_reading = parseFloat(formData.odometer_reading);
      }
      if (formData.next_service_km) {
        maintenanceData.next_service_km = parseFloat(formData.next_service_km);
      }
      if (formData.parts_replaced) {
        maintenanceData.parts_replaced = formData.parts_replaced.split(",").map(p => p.trim());
      }
      if (formData.notes) {
        maintenanceData.notes = formData.notes;
      }
      if (formData.vehicle_unavailable_from) {
        maintenanceData.vehicle_unavailable_from = new Date(formData.vehicle_unavailable_from).toISOString();
      }
      if (formData.vehicle_unavailable_until) {
        maintenanceData.vehicle_unavailable_until = new Date(formData.vehicle_unavailable_until).toISOString();
      }

      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(maintenanceData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to schedule maintenance");
      }

      setSuccess("Maintenance scheduled successfully!");
      
      // Reset form and close after brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          maintenance_type: "routine_service",
          description: "",
          scheduled_date: "",
          service_provider: "",
          cost: "",
          odometer_reading: currentOdometer.toString(),
          next_service_km: "",
          parts_replaced: "",
          notes: "",
          vehicle_unavailable_from: "",
          vehicle_unavailable_until: "",
        });
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to schedule maintenance");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = MAINTENANCE_TYPES.find(t => t.value === formData.maintenance_type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-yellow-600" />
              Schedule Maintenance
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

          {/* Maintenance Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maintenance Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MAINTENANCE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, maintenance_type: type.value })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.maintenance_type === type.value
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        formData.maintenance_type === type.value ? "text-yellow-900" : "text-gray-900"
                      }`}>
                        {type.label}
                      </p>
                      <p className={`text-xs ${
                        type.priority === "critical" ? "text-red-600" :
                        type.priority === "high" ? "text-orange-600" :
                        "text-gray-500"
                      }`}>
                        {type.priority.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Details */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the maintenance work needed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="datetime-local"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Provider
              </label>
              <input
                type="text"
                placeholder="Toyota Service Center"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={formData.service_provider}
                onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer Reading (km)
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  placeholder={currentOdometer.toString()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Next Service */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Next Service Reminder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Next Service at (km)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={`${currentOdometer + 5000}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  value={formData.next_service_km}
                  onChange={(e) => setFormData({ ...formData, next_service_km: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typically +5,000 km from current
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Parts to be Replaced
                </label>
                <input
                  type="text"
                  placeholder="Engine Oil, Oil Filter, Air Filter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  value={formData.parts_replaced}
                  onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list
                </p>
              </div>
            </div>
          </div>

          {/* Downtime Period */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Vehicle Downtime (Optional)
            </h3>
            <p className="text-xs text-yellow-800 mb-3">
              Specify when the vehicle will be unavailable for service
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unavailable From
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  value={formData.vehicle_unavailable_from}
                  onChange={(e) => setFormData({ ...formData, vehicle_unavailable_from: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unavailable Until
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  value={formData.vehicle_unavailable_until}
                  onChange={(e) => setFormData({ ...formData, vehicle_unavailable_until: e.target.value })}
                />
              </div>
            </div>
            {formData.vehicle_unavailable_from && (
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Vehicle status will be set to "maintenance" during this period
              </p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 What Happens Next:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Maintenance will be added to the schedule</li>
              <li>• You'll receive reminders before the scheduled date</li>
              <li>• Vehicle status will update if downtime period is set</li>
              <li>• You can update the record with actual costs after completion</li>
              {selectedType && selectedType.priority === "critical" && (
                <li className="text-red-600 font-semibold">
                  • ⚠️ CRITICAL priority - Schedule as soon as possible
                </li>
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
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Maintenance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceScheduler;

