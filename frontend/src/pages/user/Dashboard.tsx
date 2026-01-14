import { useAuthStore } from "../../store/authStore";
import {
  MapPin,
  Car,
  Battery,
  Zap,
  AlertCircle,
  Wrench,
  ArrowRight,
  Fuel,
  CheckCircle,
  DollarSign,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PageLoader from "../../components/PageLoader";
import { useQuery } from "@tanstack/react-query";

// Microsoft Logo Component
const MicrosoftLogo = () => (
  <div className="w-24 h-24 flex items-center justify-center">
    <svg
      width="96"
      height="96"
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

// Trip Sheets Logo Component
const TripSheetsLogo = () => (
  <div className="w-24 h-24 flex items-center justify-center">
    <svg
      width="96"
      height="96"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard background */}
      <rect x="20" y="15" width="70" height="90" rx="4" fill="#3B82F6" />
      <rect x="25" y="20" width="60" height="80" rx="2" fill="white" />

      {/* Clipboard clip */}
      <rect x="40" y="10" width="30" height="12" rx="3" fill="#1E40AF" />

      {/* Document lines */}
      <line
        x1="35"
        y1="35"
        x2="75"
        y2="35"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="35"
        y1="45"
        x2="75"
        y2="45"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="35"
        y1="55"
        x2="65"
        y2="55"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Route/Road icon overlay */}
      <circle cx="90" cy="90" r="22" fill="#10B981" />
      <path
        d="M75 90 Q82 85, 90 90 T105 90"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="78" cy="88" r="3" fill="white" />
      <circle cx="102" cy="92" r="3" fill="white" />
    </svg>
  </div>
);

export default function UserDashboard() {
  const { user, token } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(false);

  // Fetch assigned vehicle
  const { data: myVehicle } = useQuery({
    queryKey: ["my-vehicle", user?.mobile_number],
    queryFn: async () => {
      try {
        const API_URL =
          (import.meta as any).env?.VITE_API_URL ||
          "http://localhost:8000/api/v1";
        const response = await fetch(`${API_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Find vehicle assigned to this driver - match by mobile_number
          return data.vehicles?.find(
            (v: any) =>
              v.current_driver_id === user?.mobile_number ||
              v.current_driver_id === (user as any)?.user_id
          );
        }
      } catch (error) {
        console.error("Error fetching vehicle:", error);
      }
      return null;
    },
    enabled: !!token && !!user,
  });

  // Fetch user's trip statistics
  const { data: tripStats } = useQuery({
    queryKey: ["trip-stats", user?.mobile_number],
    queryFn: async () => {
      try {
        // This would need a trips endpoint - for now return mock data
        // TODO: Create endpoint GET /api/v1/users/me/trip-stats
        return {
          total_trips: 0,
          this_month: 0,
          this_week: 0,
          today: 0,
          total_km: 0,
        };
      } catch (error) {
        console.error("Error fetching trip stats:", error);
        return null;
      }
    },
    enabled: !!token && !!user,
  });

  const handleMicrosoftClick = () => {
    setShowLoader(true);
  };

  const handleLoaderComplete = () => {
    navigate("/user/trips?site=Microsoft");
  };

  const handleTripSheetClick = () => {
    navigate("/user/trip-sheet");
  };

  return (
    <>
      {showLoader && <PageLoader onComplete={handleLoaderComplete} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("dashboard.welcomeBack")}, {user?.full_name}!
          </p>
        </div>

        {/* Conditional Content Based on Status */}
        {user?.status === "pending_approval" ? (
          <div className="card">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                <span className="text-4xl">⏳</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t("dashboard.pendingApprovalTitle")}
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                {t("dashboard.pendingApprovalDesc")}
              </p>
              <p className="text-gray-600">
                {t("dashboard.pendingApprovalNote")}
              </p>
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded text-left">
                <p className="text-sm text-blue-800">
                  <strong>{t("dashboard.whatHappensNext")}</strong>
                  <br />
                  {t("dashboard.whatHappensNextDesc")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Two Column Layout: Vehicle (Left) + Work Sites (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* LEFT CARD: My Vehicle or No Vehicle */}
              <div className="card min-h-[250px]">
                {myVehicle ? (
                  <>
                    {/* Vehicle Assigned */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        My Assigned Vehicle
                      </h2>
                      <button
                        onClick={() => navigate("/user/my-vehicle")}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        View Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Vehicle Info */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-full ${
                            myVehicle.is_electric
                              ? "bg-purple-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {myVehicle.is_electric ? (
                            <Zap className="w-6 h-6 text-purple-600" />
                          ) : (
                            <Fuel className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {myVehicle.make} {myVehicle.model}
                          </h3>
                          <p className="text-gray-600">
                            {myVehicle.registration_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {myVehicle.year} • {myVehicle.color} •{" "}
                            {myVehicle.vehicle_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* EV Battery Status - Compact */}
                    {myVehicle.is_electric && myVehicle.ev_details && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Battery Status
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          <div
                            className={`p-3 rounded-lg text-center ${
                              myVehicle.ev_details.current_battery_level >= 70
                                ? "bg-green-50 border border-green-200"
                                : myVehicle.ev_details.current_battery_level >=
                                  30
                                ? "bg-yellow-50 border border-yellow-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <Battery
                              className={`w-5 h-5 mx-auto mb-1 ${
                                myVehicle.ev_details.current_battery_level >= 70
                                  ? "text-green-600"
                                  : myVehicle.ev_details
                                      .current_battery_level >= 30
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            />
                            <p className="text-xs text-gray-600">Level</p>
                            <p
                              className={`text-lg font-bold ${
                                myVehicle.ev_details.current_battery_level >= 70
                                  ? "text-green-600"
                                  : myVehicle.ev_details
                                      .current_battery_level >= 30
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {myVehicle.ev_details.current_battery_level}%
                            </p>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                            <MapPin className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Range</p>
                            <p className="text-lg font-bold text-purple-600">
                              {myVehicle.ev_details.current_range} km
                            </p>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                            <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Health</p>
                            <p className="text-lg font-bold text-blue-600">
                              {myVehicle.ev_details.battery_health}%
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <Wrench className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Cycles</p>
                            <p className="text-lg font-bold text-gray-900">
                              {myVehicle.ev_details.charging_cycles}
                            </p>
                          </div>
                        </div>

                        {/* Low Battery Alert */}
                        {myVehicle.ev_details.current_battery_level < 20 && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-sm text-red-800 font-semibold">
                              ⚠️ Low Battery! Please charge soon.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {myVehicle.is_electric && (
                        <button
                          onClick={() => navigate("/user/my-vehicle")}
                          className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-sm">Log Charging</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate("/user/my-vehicle")}
                        className={`bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${
                          !myVehicle.is_electric ? "col-span-2" : ""
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Add Expense</span>
                      </button>
                    </div>

                    {/* Odometer & Service */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Odometer</p>
                        <p className="text-base font-bold text-gray-900">
                          {myVehicle.odometer_reading?.toLocaleString() || 0} km
                        </p>
                      </div>

                      {myVehicle.next_service_km && (
                        <div
                          className={`p-3 rounded-lg border ${
                            myVehicle.next_service_km -
                              myVehicle.odometer_reading <
                            500
                              ? "bg-red-50 border-red-200"
                              : "bg-green-50 border-green-200"
                          }`}
                        >
                          <p className="text-xs text-gray-600 mb-1">
                            Next Service
                          </p>
                          <p
                            className={`text-base font-bold ${
                              myVehicle.next_service_km -
                                myVehicle.odometer_reading <
                              500
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {(
                              myVehicle.next_service_km -
                              myVehicle.odometer_reading
                            ).toLocaleString()}{" "}
                            km
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* No Vehicle Assigned */
                  <div className="text-center py-8">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Vehicle Assigned
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You don't have a vehicle assigned to you yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Please contact your administrator to get a vehicle
                      assigned.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT CARD: Work Sites Combined */}
              <div className="card p-0 overflow-hidden min-h-[250px]">
                <div className="divide-y divide-gray-200">
                  {/* Microsoft Section */}
                  <div
                    onClick={handleMicrosoftClick}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-lg">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 23 23"
                        fill="none"
                      >
                        <rect
                          x="0"
                          y="0"
                          width="11"
                          height="11"
                          fill="#F25022"
                        />
                        <rect
                          x="12"
                          y="0"
                          width="11"
                          height="11"
                          fill="#7FBA00"
                        />
                        <rect
                          x="0"
                          y="12"
                          width="11"
                          height="11"
                          fill="#00A4EF"
                        />
                        <rect
                          x="12"
                          y="12"
                          width="11"
                          height="11"
                          fill="#FFB900"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {t("dashboard.microsoftTitle")}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t("dashboard.microsoftSubtitle")}
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {t("dashboard.viewTrips")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Sheets Section */}
                  <div 
                    onClick={handleTripSheetClick}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="bg-gradient-to-br from-blue-100 to-green-100 p-3 rounded-lg">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 120 120"
                        fill="none"
                      >
                        <rect
                          x="20"
                          y="15"
                          width="70"
                          height="90"
                          rx="4"
                          fill="#3B82F6"
                        />
                        <rect
                          x="25"
                          y="20"
                          width="60"
                          height="80"
                          rx="2"
                          fill="white"
                        />
                        <rect
                          x="40"
                          y="10"
                          width="30"
                          height="12"
                          rx="3"
                          fill="#1E40AF"
                        />
                        <line
                          x1="35"
                          y1="35"
                          x2="75"
                          y2="35"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <line
                          x1="35"
                          y1="50"
                          x2="75"
                          y2="50"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <line
                          x1="35"
                          y1="65"
                          x2="75"
                          y2="65"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="80" cy="90" r="20" fill="#10B981" />
                        <path
                          d="M 72 90 L 77 95 L 88 84"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {t("dashboard.tripSheetsTitle")}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t("dashboard.tripSheetsSubtitle")}
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {t("dashboard.viewTrips")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* My Earnings Section */}
                  <div 
                    onClick={() => navigate("/user/my-earnings")}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-200"
                  >
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg">
                      <IndianRupee className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        My Earnings
                      </h3>
                      <p className="text-gray-600 text-sm">
                        View your income and commissions
                      </p>
                      <div className="flex items-center gap-2 text-green-600 mt-2">
                        <IndianRupee className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          View Earnings Report
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Money Section */}
                  <div 
                    onClick={() => navigate("/user/request-money")}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer border-t border-gray-200"
                  >
                    <div className="bg-gradient-to-br from-blue-100 to-purple-200 p-3 rounded-lg">
                      <Wallet className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        Request Money
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Request advance or withdraw earnings
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 mt-2">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Submit Request
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-xs text-gray-600">Total Trips</p>
                <p className="text-xl font-bold text-blue-600">
                  {tripStats?.total_trips || 0}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-xs text-gray-600">This Month</p>
                <p className="text-xl font-bold text-green-600">
                  {tripStats?.this_month || 0}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                <p className="text-xs text-gray-600">This Week</p>
                <p className="text-xl font-bold text-purple-600">
                  {tripStats?.this_week || 0}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                <p className="text-xs text-gray-600">Distance</p>
                <p className="text-xl font-bold text-orange-600">
                  {tripStats?.total_km?.toLocaleString() || 0} km
                </p>
              </div>
            </div>

            {/* My Vehicle Card - Compact */}
          </>
        )}
      </div>
    </>
  );
}
