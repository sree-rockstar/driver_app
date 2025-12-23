import { useState, useEffect } from "react";
import {
  Car, Battery, Zap, MapPin, Fuel, Calendar, FileText,
  AlertCircle, TrendingUp, DollarSign, Wrench, Image
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import ChargingSessionLogger from "../../components/ChargingSessionLogger";
import ExpenseTracker from "../../components/ExpenseTracker";

interface AssignedVehicle {
  vehicle_id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: string;
  fuel_type: string;
  is_electric: boolean;
  status: string;
  condition: string;
  odometer_reading: number;
  ev_details?: {
    current_battery_level: number;
    current_range: number;
    battery_health: number;
    charging_status: string;
    last_charged_at?: string;
    charging_cycles: number;
  };
  insurance_expiry?: string;
  next_service_km?: number;
  documents?: any;
  photos?: any;
}

const MyVehicle = () => {
  const { token, user } = useAuthStore();
  const [vehicle, setVehicle] = useState<AssignedVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChargingLogger, setShowChargingLogger] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [recentCharging, setRecentCharging] = useState<any[]>([]);

  useEffect(() => {
    fetchMyVehicle();
  }, []);

  const fetchMyVehicle = async () => {
    setLoading(true);
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";
      
      // Get all vehicles and find the one assigned to this driver
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Find vehicle assigned to this driver - match by mobile_number or user_id
        const myVehicle = data.vehicles?.find((v: any) => 
          v.current_driver_id === user?.mobile_number ||
          v.current_driver_id === (user as any)?.user_id
        );
        setVehicle(myVehicle || null);

        // Fetch recent charging sessions if EV
        if (myVehicle?.is_electric) {
          fetchRecentCharging(myVehicle.vehicle_id);
        }
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCharging = async (vehicleId: string) => {
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/charging/sessions?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentCharging(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching charging history:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading vehicle information...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Vehicle Assigned</h2>
          <p className="text-gray-600">
            You don't have a vehicle assigned to you yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Car className="w-8 h-8" />
          My Assigned Vehicle
        </h1>
        <p className="text-gray-600 mt-1">View and manage your assigned vehicle</p>
      </div>

      {/* Vehicle Overview Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-gray-600 text-lg">{vehicle.registration_number}</p>
            <p className="text-sm text-gray-500 mt-1">
              {vehicle.year} • {vehicle.color} • {vehicle.vehicle_type}
            </p>
          </div>
          <div className={`p-3 rounded-full ${vehicle.is_electric ? 'bg-purple-100' : 'bg-blue-100'}`}>
            {vehicle.is_electric ? (
              <Zap className="w-8 h-8 text-purple-600" />
            ) : (
              <Fuel className="w-8 h-8 text-blue-600" />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Odometer</p>
            <p className="text-xl font-bold text-gray-900">
              {vehicle.odometer_reading.toLocaleString()} km
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Condition</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {vehicle.condition.replace("_", " ")}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {vehicle.status.replace("_", " ")}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Fuel Type</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {vehicle.fuel_type}
            </p>
          </div>
        </div>
      </div>

      {/* EV Battery Status (if electric) */}
      {vehicle.is_electric && vehicle.ev_details && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Battery className="w-6 h-6" />
            Battery Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Current Level</p>
              <p className="text-3xl font-bold">{vehicle.ev_details.current_battery_level}%</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Range</p>
              <p className="text-3xl font-bold">{vehicle.ev_details.current_range} km</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Battery Health</p>
              <p className="text-3xl font-bold">{vehicle.ev_details.battery_health}%</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Charging Cycles</p>
              <p className="text-3xl font-bold">{vehicle.ev_details.charging_cycles}</p>
            </div>
          </div>

          {/* Low Battery Alert */}
          {vehicle.ev_details.current_battery_level < 20 && (
            <div className="mt-4 p-3 bg-red-500 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-semibold">
                ⚠️ Low Battery! Please charge soon.
              </p>
            </div>
          )}

          {/* Charging Button */}
          <button
            onClick={() => setShowChargingLogger(true)}
            className="mt-4 w-full bg-white text-purple-600 font-semibold py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Log Charging Session
          </button>
        </div>
      )}

      {/* Recent Charging Sessions (if EV) */}
      {vehicle.is_electric && recentCharging.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Recent Charging Sessions
          </h3>
          <div className="space-y-3">
            {recentCharging.map((session, index) => (
              <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">SOC Charged</p>
                    <p className="font-semibold text-purple-600">
                      {session.soc_charged?.toFixed(0) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">kWh</p>
                    <p className="font-semibold text-gray-900">
                      {session.kw_consumed?.toFixed(1) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cost</p>
                    <p className="font-semibold text-green-600">
                      ₹{session.amount?.toFixed(2) || 0}
                    </p>
                  </div>
                </div>
                {session.charging_station_name && (
                  <p className="text-xs text-gray-600 mt-2">
                    📍 {session.charging_station_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowExpenseTracker(true)}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Add Expense</p>
              <p className="text-sm text-gray-600">Log fuel, charging, or other expenses</p>
            </div>
          </div>
        </button>

        {vehicle.is_electric && (
          <button
            onClick={() => setShowChargingLogger(true)}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Log Charging</p>
                <p className="text-sm text-gray-600">Record a charging session</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Vehicle Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents Status */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Documents
          </h3>
          <div className="space-y-3">
            <DocumentStatus
              name="RC (Registration Certificate)"
              hasDocument={!!vehicle.documents?.registration_certificate}
              expiryDate={vehicle.insurance_expiry}
            />
            <DocumentStatus
              name="Insurance Policy"
              hasDocument={!!vehicle.documents?.insurance}
              expiryDate={vehicle.insurance_expiry}
            />
            <DocumentStatus
              name="Pollution Certificate"
              hasDocument={!!vehicle.documents?.pollution_certificate}
              expiryDate={vehicle.insurance_expiry}
            />
          </div>
        </div>

        {/* Maintenance Info */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-yellow-600" />
            Maintenance
          </h3>
          {vehicle.next_service_km ? (
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-600">Next Service Due</p>
                <p className="text-lg font-bold text-yellow-700">
                  {vehicle.next_service_km.toLocaleString()} km
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(vehicle.next_service_km - vehicle.odometer_reading).toLocaleString()} km remaining
                </p>
              </div>
              {(vehicle.next_service_km - vehicle.odometer_reading) < 500 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ Service due soon! Please schedule maintenance.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming service scheduled</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <ChargingSessionLogger
        isOpen={showChargingLogger}
        onClose={() => setShowChargingLogger(false)}
        vehicleId={vehicle.vehicle_id}
        vehicleName={`${vehicle.make} ${vehicle.model}`}
        batteryCapacity={vehicle.ev_details?.battery_capacity || 60}
        onSuccess={() => {
          fetchMyVehicle();
          if (vehicle.is_electric) {
            fetchRecentCharging(vehicle.vehicle_id);
          }
        }}
      />

      <ExpenseTracker
        isOpen={showExpenseTracker}
        onClose={() => setShowExpenseTracker(false)}
        vehicleId={vehicle.vehicle_id}
        vehicleName={`${vehicle.make} ${vehicle.model}`}
        isElectric={vehicle.is_electric}
        onSuccess={fetchMyVehicle}
      />
    </div>
  );
};

// Document Status Component
const DocumentStatus = ({ name, hasDocument, expiryDate }: any) => {
  const isExpired = expiryDate && new Date(expiryDate) < new Date();
  const daysUntilExpiry = expiryDate 
    ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  return (
    <div className={`p-3 rounded-lg border ${
      isExpired
        ? "bg-red-50 border-red-200"
        : isExpiringSoon
        ? "bg-yellow-50 border-yellow-200"
        : hasDocument
        ? "bg-green-50 border-green-200"
        : "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 text-sm">{name}</p>
          {hasDocument ? (
            <p className="text-xs text-green-600 font-medium mt-1">✓ Available</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Not available</p>
          )}
          {expiryDate && (
            <p className={`text-xs mt-1 ${
              isExpired ? "text-red-600 font-semibold" :
              isExpiringSoon ? "text-yellow-600 font-semibold" :
              "text-gray-500"
            }`}>
              {isExpired
                ? `⚠️ Expired`
                : isExpiringSoon
                ? `⚠️ Expires in ${daysUntilExpiry} days`
                : `Valid`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVehicle;

