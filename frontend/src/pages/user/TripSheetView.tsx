import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Car,
  Zap,
  Fuel,
  Battery,
  TrendingUp,
  FileText,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  DollarSign,
  IndianRupee,
  CreditCard,
  Minus,
} from "lucide-react";
import { tripsAPI } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";

interface Trip {
  _id: string;
  trip_id: string;
  site: string;
  date: string;
  start_time: string;
  expected_completion_time?: string;
  completion_time: string;
  source_point: string;
  destination: string;
  total_kilometers: number;
  trip_type?: string;
  amount?: number;
  payment_method?: string;
  expenses?: number;
  vehicle_id?: string;
  odometer_start?: number;
  odometer_end?: number;
  fuel_consumed?: number;
  battery_level_start?: number;
  battery_level_end?: number;
  battery_consumed?: number;
  energy_consumed?: number;
  charging_stops?: number;
  user_id: string;
  created_at: string;
}

export default function TripSheetView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "summary">("list");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getAll({});
      setAllTrips(response.data);
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      addToast("Failed to load trips", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter trips by selected month and search query
  const filteredTrips = allTrips.filter((trip) => {
    const matchesMonth = trip.date.startsWith(selectedMonth);
    const matchesSearch =
      searchQuery === "" ||
      trip.trip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.source_point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  // Group trips by date
  const groupedByDate = filteredTrips.reduce((acc, trip) => {
    const date = trip.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Calculate monthly statistics
  const monthlyStats = {
    total_trips: filteredTrips.length,
    total_kilometers: filteredTrips.reduce((sum, trip) => sum + trip.total_kilometers, 0),
    total_fuel: filteredTrips.reduce((sum, trip) => sum + (trip.fuel_consumed || 0), 0),
    total_energy: filteredTrips.reduce((sum, trip) => sum + (trip.energy_consumed || 0), 0),
    average_kilometers: filteredTrips.length > 0 
      ? filteredTrips.reduce((sum, trip) => sum + trip.total_kilometers, 0) / filteredTrips.length 
      : 0,
  };

  const convertTo12Hour = (time24: string | null | undefined): { time: string; period: string } => {
    if (!time24) {
      return { time: "N/A", period: "" };
    }
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr);
    const period = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour = hour - 12;
    return { time: `${hour}:${minute}`, period };
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const calculateDutyHours = (trips: Trip[]): string => {
    if (trips.length === 0) return "0h 0m";
    
    const sortedTrips = [...trips].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const firstTrip = sortedTrips[0];
    const lastTrip = sortedTrips[sortedTrips.length - 1];
    
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(firstTrip.start_time);
    const endMinutes = timeToMinutes(lastTrip.completion_time);
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header Section - Microsoft Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Top Row: Back Button & Title */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate("/user/dashboard")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  Trip Sheet
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Comprehensive view of all your trips and activities
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("summary")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "summary"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Summary
                  </button>
                </div>
                <button 
                  onClick={() => navigate("/user/add-trip")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Trip
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by trip ID, site, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Month Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-700">
                    {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showMonthPicker && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[200px]">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setShowMonthPicker(false);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === "summary" ? (
          /* Summary View */
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Trips</h3>
                <p className="text-3xl font-bold text-gray-900">{monthlyStats.total_trips}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Navigation className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Distance</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {monthlyStats.total_kilometers.toFixed(1)}
                  <span className="text-lg text-gray-600 ml-1">km</span>
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Average Distance</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {monthlyStats.average_kilometers.toFixed(1)}
                  <span className="text-lg text-gray-600 ml-1">km</span>
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    {monthlyStats.total_fuel > 0 ? (
                      <Fuel className="w-6 h-6 text-orange-600" />
                    ) : (
                      <Zap className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  {monthlyStats.total_fuel > 0 ? "Total Fuel" : "Total Energy"}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {monthlyStats.total_fuel > 0
                    ? monthlyStats.total_fuel.toFixed(1)
                    : monthlyStats.total_energy.toFixed(1)}
                  <span className="text-lg text-gray-600 ml-1">
                    {monthlyStats.total_fuel > 0 ? "L" : "kWh"}
                  </span>
                </p>
              </div>
            </div>

            {/* Monthly Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Chart visualization will be displayed here</p>
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No trips found</h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No trips recorded for this month"}
                </p>
              </div>
            ) : (
              sortedDates.map((date) => {
                const dateTrips = groupedByDate[date].sort((a, b) =>
                  a.start_time.localeCompare(b.start_time)
                );
                const isExpanded = expandedDates.has(date);
                const totalKm = dateTrips.reduce((sum, trip) => sum + trip.total_kilometers, 0);
                const dutyHours = calculateDutyHours(dateTrips);

                return (
                  <div
                    key={date}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Date Header */}
                    <button
                      onClick={() => toggleDateExpansion(date)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3 min-w-[60px] text-center">
                          <div className="text-2xl font-bold">
                            {new Date(date).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                          </div>
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-gray-900">
                            {formatDate(date)}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {dateTrips.length} {dateTrips.length === 1 ? "trip" : "trips"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="w-4 h-4" />
                              {totalKm.toFixed(1)} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {dutyHours}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <div className="text-sm font-medium text-gray-900">
                            {dateTrips.length} {dateTrips.length === 1 ? "Trip" : "Trips"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {totalKm.toFixed(1)} km total
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Trips List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {dateTrips.map((trip, index) => {
                          const startTime = convertTo12Hour(trip.start_time);
                          const endTime = convertTo12Hour(trip.completion_time);

                          return (
                            <div
                              key={trip._id}
                              className={`px-6 py-4 ${
                                index !== 0 ? "border-t border-gray-200" : ""
                              } hover:bg-white transition-colors`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Timeline */}
                                <div className="flex flex-col items-center">
                                  <div className="bg-blue-600 rounded-full p-2">
                                    <Car className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="w-0.5 h-full bg-gray-300 my-1 min-h-[40px]"></div>
                                </div>

                                {/* Trip Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-bold text-gray-900 text-lg">
                                            {trip.trip_id}
                                          </h4>
                                          <div className="flex items-center gap-3 mt-1">
                                            <p className="text-sm text-gray-600">{trip.site}</p>
                                            {trip.trip_type && (
                                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                {trip.trip_type}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => navigate(`/user/add-trip?edit=${trip._id}`)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Edit Trip"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">
                                          {startTime.time} <span className="text-xs">{startTime.period}</span>
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-medium">
                                          {endTime.time} <span className="text-xs">{endTime.period}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Route */}
                                  <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <div className="w-0.5 h-6 bg-gray-300 ml-1"></div>
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="mb-2">
                                          <p className="text-sm text-gray-600">From</p>
                                          <p className="font-medium text-gray-900">
                                            {trip.source_point}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-600">To</p>
                                          <p className="font-medium text-gray-900">
                                            {trip.destination}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Metrics */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Navigation className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs text-gray-600">Distance</span>
                                      </div>
                                      <p className="font-bold text-gray-900">
                                        {trip.total_kilometers} km
                                      </p>
                                    </div>

                                    {trip.amount && trip.amount > 0 && (
                                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <IndianRupee className="w-4 h-4 text-blue-600" />
                                          <span className="text-xs text-gray-600">Gross Amount</span>
                                        </div>
                                        <p className="font-bold text-blue-600">
                                          ₹{trip.amount.toFixed(2)}
                                        </p>
                                      </div>
                                    )}

                                    {trip.payment_method && (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <CreditCard className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs text-gray-600">Payment</span>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">
                                          {trip.payment_method}
                                        </p>
                                      </div>
                                    )}

                                    {trip.expenses && trip.expenses > 0 && (
                                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Minus className="w-4 h-4 text-red-600" />
                                          <span className="text-xs text-gray-600">Expenses</span>
                                        </div>
                                        <p className="font-bold text-red-600">
                                          ₹{trip.expenses.toFixed(2)}
                                        </p>
                                      </div>
                                    )}

                                    {trip.vehicle_id && (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Car className="w-4 h-4 text-gray-600" />
                                          <span className="text-xs text-gray-600">Vehicle</span>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">
                                          {trip.vehicle_id}
                                        </p>
                                      </div>
                                    )}

                                    {trip.fuel_consumed && (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Fuel className="w-4 h-4 text-orange-600" />
                                          <span className="text-xs text-gray-600">Fuel Used</span>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                          {trip.fuel_consumed} L
                                        </p>
                                      </div>
                                    )}

                                    {trip.battery_consumed && (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Battery className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs text-gray-600">Battery</span>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                          {trip.battery_consumed}%
                                        </p>
                                      </div>
                                    )}

                                    {trip.energy_consumed && (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Zap className="w-4 h-4 text-yellow-600" />
                                          <span className="text-xs text-gray-600">Energy</span>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                          {trip.energy_consumed} kWh
                                        </p>
                                      </div>
                                    )}
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
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

