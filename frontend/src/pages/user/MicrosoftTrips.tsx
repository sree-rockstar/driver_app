import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import AnalogueClockPicker from "../../components/AnalogueClockPicker";
import { tripsAPI } from "../../lib/api";

// Microsoft Logo Component
const MicrosoftLogo = () => (
  <div className="w-16 h-16 flex items-center justify-center">
    <svg
      width="64"
      height="64"
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

interface TripFormData {
  tripId: string;
  date: string;
  startTime: string;
  startPeriod: "AM" | "PM";
  expectedCompletionTime: string;
  expectedCompletionPeriod: "AM" | "PM";
  completionTime: string;
  completionPeriod: "AM" | "PM";
  sourcePoint: string;
  destination: string;
  totalKilometers: string;
}

export default function MicrosoftTrips() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get("edit");
  const isEditMode = !!editTripId;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<TripFormData>({
    tripId: "",
    date: getTodayDate(),
    startTime: "",
    startPeriod: "AM",
    expectedCompletionTime: "",
    expectedCompletionPeriod: "AM",
    completionTime: "",
    completionPeriod: "AM",
    sourcePoint: "",
    destination: "",
    totalKilometers: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Helper to convert 24-hour to 12-hour format
  const convertTo12Hour = (
    time24: string | null | undefined
  ): { time: string; period: string } => {
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

  // Load trip data if editing
  useEffect(() => {
    if (isEditMode && editTripId) {
      loadTripData(editTripId);
    }
  }, [isEditMode, editTripId]);

  const loadTripData = async (tripId: string) => {
    try {
      setLoading(true);
      const response = await tripsAPI.getById(tripId);
      const trip = response.data;

      // Convert 24-hour times to 12-hour format for the form
      const startTime = convertTo12Hour(trip.start_time);
      const expectedTime = convertTo12Hour(trip.expected_completion_time);
      const completionTime = convertTo12Hour(trip.completion_time);

      setFormData({
        tripId: trip.trip_id,
        date: trip.date,
        startTime: startTime.time,
        startPeriod: startTime.period as "AM" | "PM",
        expectedCompletionTime: expectedTime.time,
        expectedCompletionPeriod: expectedTime.period as "AM" | "PM",
        completionTime: completionTime.time,
        completionPeriod: completionTime.period as "AM" | "PM",
        sourcePoint: trip.source_point,
        destination: trip.destination,
        totalKilometers: trip.total_kilometers.toString(),
      });
    } catch (error: any) {
      console.error("Error loading trip:", error);
      addToast(
        t("microsoftTrips.errors.loadFailed") || "Failed to load trip",
        "error"
      );
      navigate("/user/trips?site=Microsoft");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tripId.trim()) {
      newErrors.tripId = t("microsoftTrips.errors.tripIdRequired");
    }
    if (!formData.date) {
      newErrors.date = t("microsoftTrips.errors.dateRequired");
    }
    if (!formData.startTime) {
      newErrors.startTime = t("microsoftTrips.errors.startTimeRequired");
    }
    if (!formData.expectedCompletionTime) {
      newErrors.expectedCompletionTime = t(
        "microsoftTrips.errors.expectedTimeRequired"
      );
    }
    if (!formData.completionTime) {
      newErrors.completionTime = t(
        "microsoftTrips.errors.completionTimeRequired"
      );
    }
    if (!formData.sourcePoint.trim()) {
      newErrors.sourcePoint = t("microsoftTrips.errors.sourceRequired");
    }
    if (!formData.destination.trim()) {
      newErrors.destination = t("microsoftTrips.errors.destinationRequired");
    }
    if (
      !formData.totalKilometers ||
      parseFloat(formData.totalKilometers) <= 0
    ) {
      newErrors.totalKilometers = t("microsoftTrips.errors.kilometersRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time: string, period: string): string => {
    const [hourStr, minute] = time.split(":");
    let hour = parseInt(hourStr);

    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast(t("microsoftTrips.errors.fillAllFields"), "error");
      return;
    }

    try {
      // Prepare trip data for API - convert times to 24-hour format
      const tripData = {
        trip_id: formData.tripId,
        site: "Microsoft",
        date: formData.date,
        start_time: convertTo24Hour(formData.startTime, formData.startPeriod),
        expected_completion_time: convertTo24Hour(
          formData.expectedCompletionTime,
          formData.expectedCompletionPeriod
        ),
        completion_time: convertTo24Hour(
          formData.completionTime,
          formData.completionPeriod
        ),
        source_point: formData.sourcePoint,
        destination: formData.destination,
        total_kilometers: parseFloat(formData.totalKilometers),
      };

      if (isEditMode && editTripId) {
        // Update existing trip
        await tripsAPI.update(editTripId, tripData);
        addToast(
          t("microsoftTrips.updateSuccess") || "Trip updated successfully!",
          "success"
        );
      } else {
        // Create new trip
        await tripsAPI.create(tripData);
        addToast(t("microsoftTrips.success"), "success");
      }

      navigate("/user/trips?site=Microsoft");
    } catch (error: any) {
      console.error("Error saving trip:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        t("microsoftTrips.errors.saveFailed");
      addToast(errorMessage, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {isEditMode
              ? t("microsoftTrips.editTitle")
              : t("microsoftTrips.title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode
              ? t("microsoftTrips.editSubtitle")
              : t("microsoftTrips.subtitle")}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date - Top Left - Full Width */}
          <div className="w-fit">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("microsoftTrips.date")} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`input ${errors.date ? "border-red-500" : ""}`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* 2 Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("microsoftTrips.tripId")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tripId"
                value={formData.tripId}
                onChange={handleInputChange}
                placeholder={t("microsoftTrips.tripIdPlaceholder")}
                className={`input ${errors.tripId ? "border-red-500" : ""}`}
              />
              {errors.tripId && (
                <p className="text-red-500 text-sm mt-1">{errors.tripId}</p>
              )}
            </div>

            {/* Start Time */}
            <AnalogueClockPicker
              value={formData.startTime}
              period={formData.startPeriod}
              onChange={(time) =>
                setFormData((prev) => ({ ...prev, startTime: time }))
              }
              onPeriodChange={(period) =>
                setFormData((prev) => ({ ...prev, startPeriod: period }))
              }
              label={t("microsoftTrips.startTime")}
              error={errors.startTime}
            />

            {/* Expected Completion Time */}
            <AnalogueClockPicker
              value={formData.expectedCompletionTime}
              period={formData.expectedCompletionPeriod}
              onChange={(time) =>
                setFormData((prev) => ({
                  ...prev,
                  expectedCompletionTime: time,
                }))
              }
              onPeriodChange={(period) =>
                setFormData((prev) => ({
                  ...prev,
                  expectedCompletionPeriod: period,
                }))
              }
              label={t("microsoftTrips.expectedCompletionTime")}
              error={errors.expectedCompletionTime}
            />

            {/* Completion Time */}
            <AnalogueClockPicker
              value={formData.completionTime}
              period={formData.completionPeriod}
              onChange={(time) =>
                setFormData((prev) => ({ ...prev, completionTime: time }))
              }
              onPeriodChange={(period) =>
                setFormData((prev) => ({ ...prev, completionPeriod: period }))
              }
              label={t("microsoftTrips.completionTime")}
              error={errors.completionTime}
            />

            {/* Source Point */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("microsoftTrips.sourcePoint")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sourcePoint"
                value={formData.sourcePoint}
                onChange={handleInputChange}
                placeholder={t("microsoftTrips.sourcePlaceholder")}
                className={`input ${
                  errors.sourcePoint ? "border-red-500" : ""
                }`}
              />
              {errors.sourcePoint && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.sourcePoint}
                </p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("microsoftTrips.destination")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder={t("microsoftTrips.destinationPlaceholder")}
                className={`input ${
                  errors.destination ? "border-red-500" : ""
                }`}
              />
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination}
                </p>
              )}
            </div>
          </div>

          {/* Total Kilometers - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("microsoftTrips.totalKilometers")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="totalKilometers"
              value={formData.totalKilometers}
              onChange={handleInputChange}
              placeholder={t("microsoftTrips.kilometersPlaceholder")}
              min="0"
              step="0.01"
              className={`input ${
                errors.totalKilometers ? "border-red-500" : ""
              }`}
            />
            {errors.totalKilometers && (
              <p className="text-red-500 text-sm mt-1">
                {errors.totalKilometers}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/user/trips?site=Microsoft")}
              className="btn btn-secondary"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              <span>
                {loading
                  ? t("common.loading")
                  : isEditMode
                  ? t("microsoftTrips.updateTrip")
                  : t("common.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
