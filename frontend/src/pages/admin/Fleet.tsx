import { useState, useEffect } from "react";
import { 
  Car, Plus, Search, Filter, MapPin, Zap, Fuel, 
  AlertCircle, CheckCircle, Clock, Settings, Eye,
  Battery, FileText, Upload, Image, Wrench, UserPlus
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import AddVehicleModal from "../../components/AddVehicleModal";
import VehicleDetailsModal from "../../components/VehicleDetailsModal";
import ChargingSessionLogger from "../../components/ChargingSessionLogger";
import DocumentUploader from "../../components/DocumentUploader";
import PhotoGallery from "../../components/PhotoGallery";
import MaintenanceScheduler from "../../components/MaintenanceScheduler";
import AssignVehicleModal from "../../components/AssignVehicleModal";

interface Vehicle {
  _id: string;
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
  current_driver_id?: string;
  odometer_reading: number;
  ev_details?: {
    current_battery_level: number;
    current_range: number;
    battery_health: number;
    charging_status: string;
  };
  insurance_expiry?: string;
}

interface FleetStats {
  total_vehicles: number;
  by_status: {
    available: number;
    in_use: number;
    maintenance: number;
    charging: number;
    inactive: number;
  };
  by_fuel_type: {
    electric: number;
    fuel: number;
  };
  alerts: {
    insurance_expiring_soon: number;
    insurance_expired: number;
  };
}

const Fleet = () => {
  const { token } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fuelFilter, setFuelFilter] = useState<string>("all");
  
  // Modal states
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showChargingLogger, setShowChargingLogger] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showAssignVehicle, setShowAssignVehicle] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedVehicleName, setSelectedVehicleName] = useState("");
  const [selectedVehicleOdometer, setSelectedVehicleOdometer] = useState(0);
  const [selectedBatteryCapacity, setSelectedBatteryCapacity] = useState(60);

  // Fetch fleet statistics
  const fetchStats = async () => {
    try {
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(
        `${API_URL}/vehicles/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch vehicles
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';
      let url = `${API_URL}/vehicles?limit=100`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      
      if (fuelFilter === "electric") {
        url += `&is_electric=true`;
      } else if (fuelFilter === "fuel") {
        url += `&is_electric=false`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchVehicles();
  }, [statusFilter, fuelFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchVehicles();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_use":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "charging":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get condition badge color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "needs_repair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get battery color
  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-green-600";
    if (level >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-8 h-8" />
              Fleet Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your fleet of vehicles with comprehensive tracking
            </p>
          </div>
          <button 
            onClick={() => setShowAddVehicle(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Vehicles */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Vehicles</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_vehicles}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <Car className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Available */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Available</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.by_status.available}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Electric Vehicles */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Electric Vehicles</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.by_fuel_type.electric}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Alerts</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.alerts.insurance_expiring_soon + stats.alerts.insurance_expired}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Insurance expiring/expired
            </p>
          </div>
        </div>
      )}

      {/* Status Overview */}
      {stats && (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Fleet Status</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Available: {stats.by_status.available}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-gray-700">In Use: {stats.by_status.in_use}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Maintenance: {stats.by_status.maintenance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Charging: {stats.by_status.charging}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Inactive: {stats.by_status.inactive}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle ID, registration, make, model..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="charging">Charging</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div className="relative">
            <Fuel className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
            >
              <option value="all">All Fuel Types</option>
              <option value="electric">Electric Only</option>
              <option value="fuel">Fuel Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Vehicles ({vehicles.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No vehicles found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || statusFilter !== "all" || fuelFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first vehicle to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Battery/Fuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Odometer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50 transition-colors">
                    {/* Vehicle Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${vehicle.is_electric ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          {vehicle.is_electric ? (
                            <Zap className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Fuel className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {vehicle.vehicle_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {vehicle.registration_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{vehicle.vehicle_type}</span>
                      <br />
                      <span className="text-xs text-gray-500 capitalize">
                        {vehicle.fuel_type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>

                    {/* Condition */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(
                          vehicle.condition
                        )}`}
                      >
                        {vehicle.condition.replace("_", " ").toUpperCase()}
                      </span>
                    </td>

                    {/* Battery/Fuel */}
                    <td className="px-6 py-4">
                      {vehicle.is_electric && vehicle.ev_details ? (
                        <div className="flex items-center gap-2">
                          <Battery
                            className={`w-5 h-5 ${getBatteryColor(
                              vehicle.ev_details.current_battery_level
                            )}`}
                          />
                          <div>
                            <p className={`text-sm font-semibold ${getBatteryColor(
                              vehicle.ev_details.current_battery_level
                            )}`}>
                              {vehicle.ev_details.current_battery_level}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {vehicle.ev_details.current_range} km
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Fuel className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Fuel Vehicle
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Odometer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {vehicle.odometer_reading.toLocaleString()} km
                        </span>
                      </div>
                    </td>

                    {/* Documents Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {/* RC Document */}
                        <div className="flex items-center gap-2">
                          {vehicle.documents?.registration_certificate ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">RC</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-red-600">RC</span>
                            </>
                          )}
                        </div>
                        {/* Insurance */}
                        <div className="flex items-center gap-2">
                          {vehicle.documents?.insurance ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">Insurance</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-red-600">Insurance</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedVehicleId(vehicle.vehicle_id);
                            setShowVehicleDetails(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {vehicle.is_electric && (
                          <button 
                            onClick={() => {
                              setSelectedVehicleId(vehicle.vehicle_id);
                              setSelectedVehicleName(`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
                              setSelectedBatteryCapacity(vehicle.ev_details?.battery_capacity || 60);
                              setShowChargingLogger(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Log Charging"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            setSelectedVehicleId(vehicle.vehicle_id);
                            setSelectedVehicleName(`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
                            setShowDocumentUpload(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Upload Document"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setSelectedVehicleId(vehicle.vehicle_id);
                            setSelectedVehicleName(`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
                            setShowPhotoUpload(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Upload Photo"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setSelectedVehicleId(vehicle.vehicle_id);
                            setSelectedVehicleName(`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
                            setSelectedVehicleOdometer(vehicle.odometer_reading);
                            setShowMaintenance(true);
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setSelectedVehicleId(vehicle.vehicle_id);
                            setSelectedVehicleName(`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
                            setShowAssignVehicle(true);
                          }}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Assign to Driver"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upcoming Maintenance</p>
              <p className="text-sm text-gray-600">View scheduled services</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Expiring Documents</p>
              <p className="text-sm text-gray-600">RC, Insurance, PUC alerts</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">EV Fleet Status</p>
              <p className="text-sm text-gray-600">Battery & charging overview</p>
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      <AddVehicleModal
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onSuccess={() => {
          fetchVehicles();
          fetchStats();
        }}
      />

      <VehicleDetailsModal
        isOpen={showVehicleDetails}
        onClose={() => setShowVehicleDetails(false)}
        vehicleId={selectedVehicleId}
      />

      <ChargingSessionLogger
        isOpen={showChargingLogger}
        onClose={() => setShowChargingLogger(false)}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        batteryCapacity={selectedBatteryCapacity}
        onSuccess={() => {
          fetchVehicles();
          fetchStats();
        }}
      />

      <DocumentUploader
        isOpen={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        onSuccess={() => {
          fetchVehicles();
        }}
      />

      <PhotoGallery
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        onSuccess={() => {
          fetchVehicles();
        }}
      />

      <MaintenanceScheduler
        isOpen={showMaintenance}
        onClose={() => setShowMaintenance(false)}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        currentOdometer={selectedVehicleOdometer}
        onSuccess={() => {
          fetchVehicles();
        }}
      />

      <AssignVehicleModal
        isOpen={showAssignVehicle}
        onClose={() => setShowAssignVehicle(false)}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        onSuccess={() => {
          fetchVehicles();
          fetchStats();
        }}
      />
    </div>
  );
};

export default Fleet;

