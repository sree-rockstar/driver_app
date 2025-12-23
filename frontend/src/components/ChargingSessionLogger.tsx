import { useState, useEffect } from "react";
import { X, Zap, Clock, Play, Square } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface ChargingSessionLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  batteryCapacity?: number;  // Battery capacity in kWh
  onSuccess: () => void;
}

const ChargingSessionLogger = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  batteryCapacity = 60,  // Default 60 kWh if not provided
  onSuccess,
}: ChargingSessionLoggerProps) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState<any>(null);

  // Charging completion form data - 4 REQUIRED FIELDS (kW is auto-calculated!)
  const [chargingData, setChargingData] = useState({
    start_soc: 0,
    end_soc: 0,
    amount: 0,
    charging_station_name: "",
    // Optional fields
    charging_type: "",
    payment_method: "",
    notes: "",
  });

  // Auto-calculated fields
  const [autoCalculated, setAutoCalculated] = useState({
    soc_charged: 0,
    kw_consumed: 0,  // Auto-calculated from battery capacity × SOC charged
    cost_per_kwh: 0,
  });

  // Check for active charging session
  useEffect(() => {
    if (isOpen) {
      checkActiveSession();
    }
  }, [isOpen]);

  // Update elapsed time every second for active session
  useEffect(() => {
    if (activeSession && activeSession.started_at) {
      const interval = setInterval(() => {
        const started = new Date(activeSession.started_at);
        const now = new Date();
        const diff = Math.floor((now.getTime() - started.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
      setTimer(interval);
      
      return () => {
        clearInterval(interval);
      };
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession]);

  // Auto-calculate SOC charged, kW consumed, and cost per kWh
  useEffect(() => {
    const socCharged = chargingData.end_soc - chargingData.start_soc;
    
    // Calculate kW consumed based on battery capacity and SOC charged
    // Formula: kW consumed = Battery Capacity (kWh) × (SOC Charged / 100)
    const kwConsumed = socCharged > 0 ? (batteryCapacity * socCharged) / 100 : 0;
    
    const costPerKwh = kwConsumed > 0 
      ? chargingData.amount / kwConsumed 
      : 0;

    setAutoCalculated({
      soc_charged: socCharged,
      kw_consumed: kwConsumed,
      cost_per_kwh: costPerKwh,
    });
  }, [chargingData.start_soc, chargingData.end_soc, chargingData.amount, batteryCapacity]);

  const checkActiveSession = async () => {
    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/charging/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_charging && data.session) {
          // Check if session is too old (more than 24 hours) - likely abandoned
          const sessionStart = new Date(data.session.started_at);
          const now = new Date();
          const hoursSinceStart = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceStart > 24) {
            // Session is too old, don't show it - user should start fresh
            setActiveSession(null);
            setError("Previous charging session was abandoned. Please start a new session.");
          } else {
            setActiveSession(data.session);
          }
        } else {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error("Error checking active session:", err);
    }
  };

  const startCharging = async () => {
    setError("");
    setLoading(true);

    try {
      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/charging/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to start charging session");
      }

      const data = await response.json();
      // Ensure started_at is set to current time
      const sessionData = {
        ...data,
        started_at: data.started_at || new Date().toISOString()
      };
      setActiveSession(sessionData);
      setElapsedTime(0); // Reset timer to 0
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const endCharging = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields (now only 4 - kW is auto-calculated!)
      if (!chargingData.start_soc || !chargingData.end_soc || 
          !chargingData.amount || !chargingData.charging_station_name) {
        throw new Error("All 4 required fields must be filled");
      }

      if (chargingData.end_soc <= chargingData.start_soc) {
        throw new Error("End SOC must be greater than Start SOC");
      }
      
      if (autoCalculated.kw_consumed <= 0) {
        throw new Error("Invalid SOC values - kW consumed must be greater than 0");
      }

      const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/charging/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_soc: chargingData.start_soc,
          end_soc: chargingData.end_soc,
          kw_consumed: autoCalculated.kw_consumed,  // Use auto-calculated value
          amount: chargingData.amount,
          charging_station_name: chargingData.charging_station_name,
          charging_type: chargingData.charging_type || null,
          payment_method: chargingData.payment_method || null,
          notes: chargingData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to complete charging session");
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setChargingData({
        start_soc: 0,
        end_soc: 0,
        amount: 0,
        charging_station_name: "",
        charging_type: "",
        payment_method: "",
        notes: "",
      });
      setActiveSession(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            Charging Session Logger
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Vehicle Info */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-900">Vehicle: {vehicleName}</p>
            <p className="text-xs text-purple-700 mt-1">ID: {vehicleId}</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Start Charging or Show Active Session */}
          {!activeSession ? (
            <div className="text-center py-8">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Start Charging?
              </h3>
              <p className="text-gray-600 mb-6">
                Click the button below to start recording the charging session
              </p>
              <button
                onClick={startCharging}
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Charging
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Step 2: Active Charging - Show Timer */}
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-6 h-6 animate-pulse" />
                  <p className="text-sm font-medium">Charging in Progress</p>
                </div>
                <p className="text-4xl font-bold mb-1">{formatElapsedTime(elapsedTime)}</p>
                <p className="text-sm opacity-90">Elapsed Time</p>
              </div>

              {/* Step 3: Complete Charging Form - 5 REQUIRED FIELDS */}
              <form onSubmit={endCharging}>
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3 text-lg">
                    📋 Complete Charging Session - Enter 4 Required Fields
                  </h3>
                  <p className="text-xs text-yellow-800 mb-3">
                    💡 kW Consumed is auto-calculated based on your battery capacity ({batteryCapacity} kWh) and SOC charged
                  </p>

                  <div className="space-y-4">
                    {/* Field 1: Start SOC */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        1. Start SOC (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="1"
                        placeholder="15"
                        className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        value={chargingData.start_soc || ""}
                        onChange={(e) =>
                          setChargingData({ ...chargingData, start_soc: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Battery percentage when charging started
                      </p>
                    </div>

                    {/* Field 2: End SOC */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        2. End SOC (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="1"
                        placeholder="85"
                        className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        value={chargingData.end_soc || ""}
                        onChange={(e) =>
                          setChargingData({ ...chargingData, end_soc: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Battery percentage when charging ended
                      </p>
                      {autoCalculated.soc_charged > 0 && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          ✓ Charged: {autoCalculated.soc_charged.toFixed(0)}%
                        </p>
                      )}
                    </div>

                    {/* Field 3: Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        3. Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="336"
                        className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        value={chargingData.amount || ""}
                        onChange={(e) =>
                          setChargingData({ ...chargingData, amount: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total cost paid in rupees
                      </p>
                      {autoCalculated.cost_per_kwh > 0 && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          ✓ Cost per kWh: ₹{autoCalculated.cost_per_kwh.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Auto-Calculated: kW Consumed */}
                    {autoCalculated.kw_consumed > 0 && (
                      <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                        <label className="block text-sm font-semibold text-green-900 mb-1">
                          ⚡ kW Consumed (Auto-Calculated)
                        </label>
                        <p className="text-2xl font-bold text-green-600">
                          {autoCalculated.kw_consumed.toFixed(2)} kWh
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Calculated: {batteryCapacity} kWh × {autoCalculated.soc_charged.toFixed(0)}% = {autoCalculated.kw_consumed.toFixed(2)} kWh
                        </p>
                      </div>
                    )}

                    {/* Field 4: Charging Station Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        4. Charging Station Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Tata Power, MG Road, Bangalore"
                        className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        value={chargingData.charging_station_name}
                        onChange={(e) =>
                          setChargingData({
                            ...chargingData,
                            charging_station_name: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Station name and location
                      </p>
                    </div>
                  </div>

                  {/* Auto-Calculated Summary */}
                  {autoCalculated.soc_charged > 0 && autoCalculated.cost_per_kwh > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        ✅ Auto-Calculated Summary:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">SOC Charged:</span>
                          <span className="ml-2 font-semibold text-green-700">
                            {autoCalculated.soc_charged.toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">kW Consumed:</span>
                          <span className="ml-2 font-semibold text-green-700">
                            {autoCalculated.kw_consumed.toFixed(2)} kWh
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost per kWh:</span>
                          <span className="ml-2 font-semibold text-green-700">
                            ₹{autoCalculated.cost_per_kwh.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-semibold text-green-700">
                            {formatElapsedTime(elapsedTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Optional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Charging Type
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={chargingData.charging_type}
                        onChange={(e) =>
                          setChargingData({ ...chargingData, charging_type: e.target.value })
                        }
                      >
                        <option value="">Select type</option>
                        <option value="ac_slow">AC Slow</option>
                        <option value="ac_fast">AC Fast</option>
                        <option value="dc_fast">DC Fast</option>
                        <option value="home">Home Charging</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={chargingData.payment_method}
                        onChange={(e) =>
                          setChargingData({ ...chargingData, payment_method: e.target.value })
                        }
                      >
                        <option value="">Select method</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any additional notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={chargingData.notes}
                      onChange={(e) =>
                        setChargingData({ ...chargingData, notes: e.target.value })
                      }
                    />
                  </div>
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
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Complete Charging
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChargingSessionLogger;

