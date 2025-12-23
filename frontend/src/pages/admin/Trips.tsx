import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, Clock, Route, ChevronDown, ChevronUp, User, Download } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { tripsAPI } from "../../lib/api";
import { api } from "../../lib/api";

interface Trip {
  _id: string;
  trip_id: string;
  site: string;
  date: string;
  start_time: string;
  expected_completion_time: string;
  completion_time: string;
  source_point: string;
  destination: string;
  total_kilometers: number;
  user_id: string;
  created_at: string;
}

interface DriverInfo {
  _id: string;
  full_name: string;
  mobile_number: string;
}

export default function AdminTrips() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Record<string, DriverInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedSite, setSelectedSite] = useState<string>("All");
  const [selectedDriver, setSelectedDriver] = useState<string>("All");
  const [collapsedDrivers, setCollapsedDrivers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Helper to convert 24-hour to 12-hour format
  const convertTo12Hour = (time24: string | null | undefined): { time: string; period: string } => {
    if (!time24) {
      return { time: "N/A", period: "" };
    }
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr);
    const period = hour >= 12 ? "PM" : "AM";
    
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    
    return { time: `${hour}:${minute}`, period };
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      // Admin endpoint to get all trips
      const response = await api.get('/admin/trips');
      setAllTrips(response.data);
      
      // Fetch driver info
      const driversResponse = await api.get('/admin/users');
      const driversMap: Record<string, DriverInfo> = {};
      driversResponse.data.forEach((driver: any) => {
        // Use both _id and id as keys to handle different formats
        const driverId = driver.id || driver._id;
        driversMap[driverId] = {
          _id: driverId,
          full_name: driver.full_name,
          mobile_number: driver.mobile_number,
        };
        // Also store with _id if id exists
        if (driver.id && driver._id && driver.id !== driver._id) {
          driversMap[driver._id] = {
            _id: driver._id,
            full_name: driver.full_name,
            mobile_number: driver.mobile_number,
          };
        }
      });
      setDrivers(driversMap);
      
      console.log("Drivers map:", driversMap);
      console.log("Sample trip user_id:", response.data[0]?.user_id);
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      addToast("Failed to load trips", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Filter trips by month, site, and driver
  const filteredTrips = allTrips.filter((trip) => {
    const matchesMonth = trip.date.startsWith(selectedMonth);
    const matchesSite = selectedSite === "All" || trip.site === selectedSite;
    const matchesDriver = selectedDriver === "All" || trip.user_id === selectedDriver;
    return matchesMonth && matchesSite && matchesDriver;
  });

  // Group trips by driver
  const groupedByDriver = filteredTrips.reduce((acc, trip) => {
    const driverId = trip.user_id;
    if (!acc[driverId]) {
      acc[driverId] = [];
    }
    acc[driverId].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  // Sort trips within each driver by date and time
  Object.keys(groupedByDriver).forEach(driverId => {
    groupedByDriver[driverId].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });
  });

  // Collapse all drivers by default when filters change
  useEffect(() => {
    if (allTrips.length > 0) {
      // Calculate which drivers would be shown
      const driversInView = new Set<string>();
      allTrips.forEach(trip => {
        const matchesMonth = trip.date.startsWith(selectedMonth);
        const matchesSite = selectedSite === "All" || trip.site === selectedSite;
        const matchesDriver = selectedDriver === "All" || trip.user_id === selectedDriver;
        if (matchesMonth && matchesSite && matchesDriver) {
          driversInView.add(trip.user_id);
        }
      });
      setCollapsedDrivers(driversInView);
    }
  }, [selectedMonth, selectedSite, selectedDriver, allTrips]);

  const toggleDriverCollapse = (driverId: string) => {
    const newCollapsed = new Set(collapsedDrivers);
    if (newCollapsed.has(driverId)) {
      newCollapsed.delete(driverId);
    } else {
      newCollapsed.add(driverId);
    }
    setCollapsedDrivers(newCollapsed);
  };

  const getDriverStats = (driverTrips: Trip[]) => {
    const totalKm = driverTrips.reduce((sum, trip) => sum + trip.total_kilometers, 0);
    return {
      count: driverTrips.length,
      totalKm: totalKm.toFixed(1),
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const uniqueSites = ["All", ...Array.from(new Set(allTrips.map(t => t.site)))];
  
  // Get unique driver IDs from trips (those who actually have trips)
  const driversWithTrips = Array.from(new Set(allTrips.map(t => t.user_id)));
  const uniqueDrivers = ["All", ...driversWithTrips];

  // Calculate overall stats
  const overallStats = {
    total_trips: filteredTrips.length,
    total_kilometers: filteredTrips.reduce((sum, t) => sum + t.total_kilometers, 0),
    total_drivers: Object.keys(groupedByDriver).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t("admin.tripsManagement")}
        </h1>
        <p className="text-gray-600 mt-2">
          {t("admin.viewAllTrips")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Calendar className="w-5 h-5" />
          <span>{t("microsoftTrips.filters")}</span>
        </button>
      </div>

      {showFilters && (
        <div className="card bg-white shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("microsoftTrips.selectMonth")}
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input"
              />
            </div>

            {/* Site Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.site")}
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="input"
              >
                {uniqueSites.map((site) => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>

            {/* Driver Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.driver")}
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="input"
              >
                <option value="All">{t("admin.allDrivers")}</option>
                {uniqueDrivers.filter(d => d !== "All").map((driverId) => {
                  const driverInfo = drivers[driverId];
                  return (
                    <option key={driverId} value={driverId}>
                      {driverInfo?.full_name || `Driver ${driverId.slice(0, 8)}`}
                      {driverInfo?.mobile_number && ` (${driverInfo.mobile_number})`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      <div className="p-[2px] bg-gradient-to-r from-[#F25022] via-[#7FBA00] via-[#00A4EF] to-[#FFB900] rounded-xl shadow-lg">
        <div className="card bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl m-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Route className="w-6 h-6 text-[#00A4EF]" />
              <span>{t("admin.overallStats")}</span>
              <span className="text-sm font-normal text-gray-600">
                ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#F25022] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#F25022] rounded-lg shadow-sm">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("microsoftTrips.totalTrips")}</p>
                  <p className="text-3xl font-bold text-[#F25022]">{overallStats.total_trips}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#7FBA00] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#7FBA00] rounded-lg shadow-sm">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("microsoftTrips.totalKm")}</p>
                  <p className="text-3xl font-bold text-[#7FBA00]">
                    {overallStats.total_kilometers.toFixed(1)}
                    <span className="text-lg ml-1">km</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#00A4EF] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#00A4EF] rounded-lg shadow-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("admin.activeDrivers")}</p>
                  <p className="text-3xl font-bold text-[#00A4EF]">{overallStats.total_drivers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips by Driver */}
      {Object.keys(groupedByDriver).length === 0 ? (
        <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
          <Route className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("admin.noTripsFound")}
          </h3>
          <p className="text-gray-600">
            {t("admin.noTripsForPeriod")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDriver).map(([driverId, driverTrips]) => {
            const driver = drivers[driverId];
            const isCollapsed = collapsedDrivers.has(driverId);
            const stats = getDriverStats(driverTrips);

            const driverInfo = drivers[driverId];
            
            return (
              <div key={driverId}>
                {/* Driver Header - Collapsible */}
                <button
                  onClick={() => toggleDriverCollapse(driverId)}
                  className="w-full bg-gradient-to-r from-[#00A4EF] to-[#7FBA00] text-white px-4 py-3 rounded-lg shadow-lg hover:from-[#008cc9] hover:to-[#6a9e00] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5" />
                      <div className="text-left">
                        <h2 className="text-lg font-bold">
                          {driverInfo?.full_name || `Driver (${driverId.slice(0, 8)}...)`}
                        </h2>
                        <p className="text-xs opacity-90">
                          {driverInfo?.mobile_number || "Mobile not available"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Driver Summary */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-4 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur text-xs">
                        <div className="text-center">
                          <p className="opacity-90 font-medium">{t("microsoftTrips.trips")}</p>
                          <p className="font-bold text-base">{stats.count}</p>
                        </div>
                        <div className="w-px h-6 bg-white/40"></div>
                        <div className="text-center">
                          <p className="opacity-90 font-medium">{t("microsoftTrips.distance")}</p>
                          <p className="font-bold text-base">{stats.totalKm} km</p>
                        </div>
                      </div>
                      
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Driver's Trips */}
                {!isCollapsed && (
                  <div className="mt-3 space-y-3 pl-4">
                    {driverTrips.map((trip) => {
                      const startTimeFormatted = convertTo12Hour(trip.start_time);
                      const expectedTimeFormatted = convertTo12Hour(trip.expected_completion_time);
                      const completionTimeFormatted = convertTo12Hour(trip.completion_time);

                      return (
                        <div
                          key={trip._id}
                          className="p-[2px] bg-gradient-to-r from-[#F25022] via-[#7FBA00] via-[#00A4EF] to-[#FFB900] rounded-xl hover:p-[3px] transition-all duration-300"
                        >
                          <div className="card bg-white border-l-4 border-[#00A4EF] rounded-xl m-0">
                            <div className="space-y-3">
                              {/* Trip Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {trip.trip_id}
                                  </h3>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(trip.date)}
                                  </p>
                                </div>
                                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-medium">
                                  {trip.site}
                                </span>
                              </div>

                              {/* Route Info */}
                              <div className="flex items-center space-x-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <MapPin className="w-5 h-5 text-[#7FBA00] flex-shrink-0" />
                                <span className="font-semibold text-gray-800">{trip.source_point}</span>
                                <span className="text-gray-400 font-bold">→</span>
                                <span className="font-semibold text-gray-800">{trip.destination}</span>
                                <span className="ml-auto text-sm bg-[#00A4EF] text-white px-4 py-1.5 rounded-full font-bold shadow-md">
                                  {trip.total_kilometers} km
                                </span>
                              </div>

                              {/* Time Info */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="bg-white border-l-4 border-[#F25022] p-3 rounded-lg shadow-sm">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-[#F25022] flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-500 text-xs font-medium">
                                        {t("microsoftTrips.start")}
                                      </p>
                                      <p className="font-bold text-gray-900 text-base">
                                        {startTimeFormatted.time} {startTimeFormatted.period}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white border-l-4 border-[#FFB900] p-3 rounded-lg shadow-sm">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-[#FFB900] flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-500 text-xs font-medium">
                                        {t("microsoftTrips.expected")}
                                      </p>
                                      <p className="font-bold text-gray-900 text-base">
                                        {expectedTimeFormatted.time} {expectedTimeFormatted.period}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white border-l-4 border-[#7FBA00] p-3 rounded-lg shadow-sm">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-[#7FBA00] flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-500 text-xs font-medium">
                                        {t("microsoftTrips.completed")}
                                      </p>
                                      <p className="font-bold text-gray-900 text-base">
                                        {completionTimeFormatted.time} {completionTimeFormatted.period}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

