import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, MapPin, Calendar, Clock, Route, Filter, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { tripsAPI } from "../../lib/api";

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
  created_at: string;
}

// Microsoft Logo Component
const MicrosoftLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <svg
      width="48"
      height="48"
      viewBox="0 0 23 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="11" height="11" fill="#F25022" />
      <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
      <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
      <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
    </svg>
  </div>
);

export default function TripsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [searchParams] = useSearchParams();
  const site = searchParams.get("site") || "Microsoft";

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState({
    total_trips: 0,
    total_kilometers: 0,
    average_kilometers: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format for current month
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

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

  // Helper class to calculate duty hours
  const calculateDutyHours = (dateTrips: Trip[]): string => {
    if (dateTrips.length === 0) return "0h 0m";
    
    // Get first trip's start time and last trip's completion time
    const firstTrip = dateTrips[0]; // Already sorted by start_time
    const lastTrip = dateTrips[dateTrips.length - 1];
    
    const startTime = firstTrip.start_time;
    const endTime = lastTrip.completion_time;
    
    // Convert time strings to minutes
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Calculate difference (handle overnight if needed)
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours if it crosses midnight
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getAll({ site });
      setAllTrips(response.data);
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      addToast("Failed to load trips", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [site]);

  // Filter trips for selected month only
  const monthTrips = allTrips.filter((trip: Trip) => 
    trip.date.startsWith(selectedMonth)
  );

  // Calculate stats for selected month
  useEffect(() => {
    const monthlyTotal = monthTrips.reduce((sum, trip) => 
      sum + trip.total_kilometers, 0
    );
    
    setMonthlyStats({
      total_trips: monthTrips.length,
      total_kilometers: monthlyTotal,
      average_kilometers: monthTrips.length > 0 ? monthlyTotal / monthTrips.length : 0,
    });

    // Collapse all dates by default when month changes
    const uniqueDates = [...new Set(monthTrips.map((trip: Trip) => trip.date))];
    setCollapsedDates(new Set(uniqueDates));
  }, [allTrips, selectedMonth]);

  // Group trips by date
  const groupedTrips = monthTrips.reduce((acc, trip) => {
    const date = trip.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  // Sort trips within each date by start time (ascending)
  Object.keys(groupedTrips).forEach(date => {
    groupedTrips[date].sort((a, b) => {
      // Compare times in 24-hour format (they're already stored as HH:MM)
      return a.start_time.localeCompare(b.start_time);
    });
  });

  const sortedDates = Object.keys(groupedTrips).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const toggleDateCollapse = (date: string) => {
    const newCollapsed = new Set(collapsedDates);
    if (newCollapsed.has(date)) {
      newCollapsed.delete(date);
    } else {
      newCollapsed.add(date);
    }
    setCollapsedDates(newCollapsed);
  };

  const getDailySummary = (dateTrips: Trip[]) => {
    const totalKm = dateTrips.reduce((sum, trip) => sum + trip.total_kilometers, 0);
    const dutyHours = calculateDutyHours(dateTrips);
    return {
      count: dateTrips.length,
      totalKm: totalKm.toFixed(1),
      dutyHours: dutyHours,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl shadow-sm">
            <MicrosoftLogo />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {site} {t("microsoftTrips.tripsList")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("microsoftTrips.viewManageTrips")}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Calendar className="w-5 h-5" />
            <span>{t("microsoftTrips.selectMonth")}</span>
          </button>
          <button
            onClick={() => navigate("/user/microsoft-trips")}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t("microsoftTrips.addTrip")}</span>
          </button>
        </div>
      </div>

      {/* Month Picker */}
      {showMonthPicker && (
        <div className="card bg-white shadow-md border-l-4 border-[#FFB900]">
          <div className="flex items-center space-x-4">
            <Calendar className="w-6 h-6 text-[#FFB900]" />
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("microsoftTrips.selectMonthFilter")}
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input focus:border-[#00A4EF] focus:ring-[#00A4EF]"
              />
            </div>
            <button
              onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
              className="px-4 py-2 bg-[#00A4EF] text-white rounded-lg font-semibold hover:bg-[#008cc9] hover:shadow-lg transition-all"
            >
              {t("microsoftTrips.currentMonth")}
            </button>
          </div>
        </div>
      )}

      {/* Monthly Statistics Cards - Microsoft Theme */}
      <div className="p-[2px] bg-gradient-to-r from-[#F25022] via-[#7FBA00] via-[#00A4EF] to-[#FFB900] rounded-xl shadow-lg hover:p-[3px] transition-all duration-300">
        <div className="card bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl m-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-[#00A4EF]" />
              <span>{t("microsoftTrips.monthlyStats")}</span>
              <span className="text-sm font-normal text-gray-600">
                ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Trips - Red Theme */}
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#F25022] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#F25022] rounded-lg shadow-sm">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("microsoftTrips.totalTrips")}</p>
                  <p className="text-3xl font-bold text-[#F25022]">{monthlyStats.total_trips}</p>
                </div>
              </div>
            </div>

            {/* Total Distance - Green Theme */}
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#7FBA00] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#7FBA00] rounded-lg shadow-sm">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("microsoftTrips.totalKm")}</p>
                  <p className="text-3xl font-bold text-[#7FBA00]">
                    {monthlyStats.total_kilometers.toFixed(1)}
                    <span className="text-lg ml-1">km</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Average Distance - Blue Theme */}
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-[#00A4EF] hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#00A4EF] rounded-lg shadow-sm">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("microsoftTrips.avgKm")}</p>
                  <p className="text-3xl font-bold text-[#00A4EF]">
                    {monthlyStats.average_kilometers.toFixed(1)}
                    <span className="text-lg ml-1">km</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips List */}
      {monthTrips.length === 0 ? (
        <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-[#00A4EF]">
          <div className="mb-4">
            <div className="inline-block p-6 bg-white rounded-full shadow-md mb-4">
              <Route className="w-16 h-16 text-[#00A4EF]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t("microsoftTrips.noTripsForMonth")}
          </h3>
          <p className="text-gray-600 mb-2">
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {t("microsoftTrips.noTripsDesc")}
          </p>
          <button
            onClick={() => navigate("/user/microsoft-trips")}
            className="bg-[#00A4EF] text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2 hover:bg-[#008cc9] hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>{t("microsoftTrips.addTrip")}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateTrips = groupedTrips[date];
            if (!dateTrips || dateTrips.length === 0) return null;
            
            const isCollapsed = collapsedDates.has(date);
            const dailySummary = getDailySummary(dateTrips);

            return (
              <div key={date} className="space-y-3">
                {/* Date Header - Clickable - Microsoft Blue/Green Gradient */}
                <button
                  onClick={() => toggleDateCollapse(date)}
                  className="w-full sticky top-0 bg-gradient-to-r from-[#00A4EF] to-[#7FBA00] text-white px-4 py-2.5 rounded-lg shadow-lg z-10 hover:from-[#008cc9] hover:to-[#6a9e00] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <h2 className="text-lg font-bold">
                        {formatDate(date)}
                      </h2>
                    </div>
                    
                    {/* Daily Summary */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-4 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur text-xs">
                        <div className="text-center">
                          <p className="opacity-90 font-medium">{t("microsoftTrips.trips")}</p>
                          <p className="font-bold text-base">{dailySummary.count}</p>
                        </div>
                        <div className="w-px h-6 bg-white/40"></div>
                        <div className="text-center">
                          <p className="opacity-90 font-medium">{t("microsoftTrips.distance")}</p>
                          <p className="font-bold text-base">{dailySummary.totalKm} km</p>
                        </div>
                        <div className="w-px h-6 bg-white/40"></div>
                        <div className="text-center">
                          <p className="opacity-90 font-medium">{t("microsoftTrips.dutyHours")}</p>
                          <p className="font-bold text-base">{dailySummary.dutyHours}</p>
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

                {/* Trips for this date - Collapsible */}
                {!isCollapsed && (
                  <div className="space-y-3 pl-4">
                  {dateTrips.map((trip) => {
                    const startTimeFormatted = convertTo12Hour(trip.start_time);
                    const expectedTimeFormatted = convertTo12Hour(trip.expected_completion_time);
                    const completionTimeFormatted = convertTo12Hour(trip.completion_time);

                    return (
                      <div
                        key={trip._id}
                        className="p-[2px] bg-gradient-to-r from-[#F25022] via-[#7FBA00] via-[#00A4EF] to-[#FFB900] rounded-xl hover:p-[3px] transition-all duration-300"
                      >
                        <div className="card bg-white hover:shadow-xl transition-all duration-300 border-l-4 border-[#00A4EF] rounded-xl m-0">
                          <div className="space-y-3">
                            {/* Trip Header */}
                            <div className="flex items-start justify-between">
                              <h3 className="text-xl font-bold text-gray-900">
                                {trip.trip_id}
                              </h3>
                              <button
                                onClick={() => navigate(`/user/microsoft-trips?edit=${trip.trip_id}`)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                title={t("common.edit")}
                              >
                                <Edit className="w-5 h-5 text-[#00A4EF] group-hover:scale-110 transition-transform" />
                              </button>
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

                            {/* Time Info - Microsoft Colors - Subtle Design */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              {/* Start Time - Red */}
                              <div className="bg-white border-l-4 border-[#F25022] p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
                              
                              {/* Expected Time - Yellow */}
                              <div className="bg-white border-l-4 border-[#FFB900] p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
                              
                              {/* Completed Time - Green */}
                              <div className="bg-white border-l-4 border-[#7FBA00] p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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

