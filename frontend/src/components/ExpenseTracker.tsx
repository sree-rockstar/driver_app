import { useState } from "react";
import { X, DollarSign, Fuel, Zap, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface ExpenseTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  isElectric: boolean;
  onSuccess: () => void;
}

const EXPENSE_TYPES = [
  { value: "fuel", label: "Fuel", icon: "⛽", color: "blue" },
  { value: "charging", label: "Charging", icon: "⚡", color: "purple" },
  { value: "maintenance", label: "Maintenance", icon: "🔧", color: "yellow" },
  { value: "insurance", label: "Insurance", icon: "🛡️", color: "green" },
  { value: "tax", label: "Tax", icon: "📋", color: "gray" },
  { value: "fine", label: "Fine", icon: "⚠️", color: "red" },
  { value: "toll", label: "Toll", icon: "🚧", color: "orange" },
  { value: "parking", label: "Parking", icon: "🅿️", color: "indigo" },
  { value: "other", label: "Other", icon: "📝", color: "gray" },
];

const ExpenseTracker = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  isElectric,
  onSuccess,
}: ExpenseTrackerProps) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    expense_type: isElectric ? "charging" : "fuel",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    payment_method: "",
    odometer_reading: "",
    // Fuel specific
    fuel_quantity: "",
    fuel_price_per_liter: "",
    // Charging specific
    kw_consumed: "",
    start_soc: "",
    end_soc: "",
    charging_station_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

      // Prepare expense data
      const expenseData: any = {
        vehicle_id: vehicleId,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date).toISOString(),
      };

      // Add optional common fields
      if (formData.payment_method) {
        expenseData.payment_method = formData.payment_method;
      }
      if (formData.odometer_reading) {
        expenseData.odometer_reading = parseFloat(formData.odometer_reading);
      }

      // Add fuel-specific fields
      if (formData.expense_type === "fuel") {
        if (!formData.fuel_quantity || !formData.fuel_price_per_liter) {
          throw new Error("Fuel expenses require fuel quantity and price per liter");
        }
        expenseData.fuel_quantity = parseFloat(formData.fuel_quantity);
        expenseData.fuel_price_per_liter = parseFloat(formData.fuel_price_per_liter);
      }

      // Add charging-specific fields
      if (formData.expense_type === "charging") {
        if (!formData.kw_consumed || !formData.start_soc || !formData.end_soc) {
          throw new Error("Charging expenses require kW consumed, start SOC, and end SOC");
        }
        expenseData.kw_consumed = parseFloat(formData.kw_consumed);
        expenseData.start_soc = parseFloat(formData.start_soc);
        expenseData.end_soc = parseFloat(formData.end_soc);
        expenseData.charging_station_name = formData.charging_station_name;
        expenseData.cost_per_kwh = parseFloat(formData.amount) / parseFloat(formData.kw_consumed);
      }

      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to add expense");
      }

      setSuccess("Expense added successfully!");
      
      // Reset form and close after brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          expense_type: isElectric ? "charging" : "fuel",
          amount: "",
          description: "",
          date: new Date().toISOString().split('T')[0],
          payment_method: "",
          odometer_reading: "",
          fuel_quantity: "",
          fuel_price_per_liter: "",
          kw_consumed: "",
          start_soc: "",
          end_soc: "",
          charging_station_name: "",
        });
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = EXPENSE_TYPES.find(t => t.value === formData.expense_type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Add Expense
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

          {/* Expense Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Expense Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {EXPENSE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, expense_type: type.value })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.expense_type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <p className={`text-xs font-medium ${
                    formData.expense_type === type.value ? `text-${type.color}-900` : "text-gray-700"
                  }`}>
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Fields */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="500"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief description of the expense..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odometer Reading (km)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Current km reading"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
              />
            </div>
          </div>

          {/* Fuel-Specific Fields */}
          {formData.expense_type === "fuel" && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm flex items-center gap-2">
                <Fuel className="w-4 h-4" />
                Fuel Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fuel Quantity (liters) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={formData.fuel_quantity}
                    onChange={(e) => setFormData({ ...formData, fuel_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price per Liter (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={formData.fuel_price_per_liter}
                    onChange={(e) => setFormData({ ...formData, fuel_price_per_liter: e.target.value })}
                  />
                </div>
              </div>
              {formData.fuel_quantity && formData.fuel_price_per_liter && (
                <p className="text-sm text-blue-800 mt-2">
                  ✓ Total: ₹{(parseFloat(formData.fuel_quantity) * parseFloat(formData.fuel_price_per_liter)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Charging-Specific Fields */}
          {formData.expense_type === "charging" && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Charging Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start SOC (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={formData.start_soc}
                    onChange={(e) => setFormData({ ...formData, start_soc: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End SOC (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="85"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={formData.end_soc}
                    onChange={(e) => setFormData({ ...formData, end_soc: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    kW Consumed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    placeholder="42"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={formData.kw_consumed}
                    onChange={(e) => setFormData({ ...formData, kw_consumed: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Charging Station Name
                  </label>
                  <input
                    type="text"
                    placeholder="Tata Power, MG Road"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={formData.charging_station_name}
                    onChange={(e) => setFormData({ ...formData, charging_station_name: e.target.value })}
                  />
                </div>
              </div>
              
              {formData.kw_consumed && formData.amount && parseFloat(formData.kw_consumed) > 0 && (
                <p className="text-sm text-purple-800 mt-2">
                  ✓ Cost per kWh: ₹{(parseFloat(formData.amount) / parseFloat(formData.kw_consumed)).toFixed(2)}
                </p>
              )}
            </div>
          )}

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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseTracker;

