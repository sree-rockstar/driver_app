import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import AnalogueClockPicker from "../../components/AnalogueClockPicker";
import { tripsAPI, api } from "../../lib/api";

interface TripFormData {
  tripId: string;
  date: string;
  tripType: string;
  sourcePoint: string;
  destination: string;
  startTime: string;
  startPeriod: "AM" | "PM";
  endTime: string;
  endPeriod: "AM" | "PM";
  totalKilometers: string;
  amount: string;
  paymentMethod: string;
  expenses: string;
}

interface TripType {
  _id: string;
  name: string;
  is_active: boolean;
}

interface PaymentMethod {
  _id: string;
  name: string;
  is_active: boolean;
}

export default function AddEditTrip() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get("edit");
  const isEditMode = !!editTripId;

  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

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
    tripType: "",
    sourcePoint: "",
    destination: "",
    startTime: "",
    startPeriod: "AM",
    endTime: "",
    endPeriod: "AM",
    totalKilometers: "",
    amount: "",
    paymentMethod: "",
    expenses: "",
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

  // Fetch trip types and payment methods
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoadingConfig(true);
      const [tripTypesRes, paymentMethodsRes] = await Promise.all([
        api.get("/trip-types"),
        api.get("/payment-methods"),
      ]);
      setTripTypes(tripTypesRes.data);
      setPaymentMethods(paymentMethodsRes.data);
    } catch (error: any) {
      console.error("Error fetching configs:", error);
      addToast("Failed to load trip configuration", "error");
    } finally {
      setLoadingConfig(false);
    }
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
      const endTime = convertTo12Hour(trip.completion_time);

      setFormData({
        tripId: trip.trip_id,
        date: trip.date,
        tripType: trip.trip_type || "",
        sourcePoint: trip.source_point,
        destination: trip.destination,
        startTime: startTime.time,
        startPeriod: startTime.period as "AM" | "PM",
        endTime: endTime.time,
        endPeriod: endTime.period as "AM" | "PM",
        totalKilometers: trip.total_kilometers.toString(),
        amount: trip.amount?.toString() || "",
        paymentMethod: trip.payment_method || "",
        expenses: trip.expenses?.toString() || "",
      });
    } catch (error: any) {
      console.error("Error loading trip:", error);
      addToast("Failed to load trip", "error");
      navigate("/user/trip-sheet");
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
      newErrors.tripId = "Trip ID is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.tripType) {
      newErrors.tripType = "Trip type is required";
    }
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }
    if (!formData.sourcePoint.trim()) {
      newErrors.sourcePoint = "Source is required";
    }
    if (!formData.destination.trim()) {
      newErrors.destination = "Destination is required";
    }
    if (
      !formData.totalKilometers ||
      parseFloat(formData.totalKilometers) <= 0
    ) {
      newErrors.totalKilometers = "Total kilometers must be greater than 0";
    }
    if (formData.amount && parseFloat(formData.amount) < 0) {
      newErrors.amount = "Amount cannot be negative";
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
      addToast("Please fill all required fields", "error");
      return;
    }

    try {
      // Prepare trip data for API - convert times to 24-hour format
      const tripData = {
        trip_id: formData.tripId,
        site: "Trip Sheet", // Default site for trip sheet entries
        date: formData.date,
        start_time: convertTo24Hour(formData.startTime, formData.startPeriod),
        completion_time: convertTo24Hour(formData.endTime, formData.endPeriod),
        source_point: formData.sourcePoint,
        destination: formData.destination,
        total_kilometers: parseFloat(formData.totalKilometers),
        trip_type: formData.tripType,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        payment_method: formData.paymentMethod || undefined,
        expenses: formData.expenses ? parseFloat(formData.expenses) : undefined,
      };

      if (isEditMode && editTripId) {
        // Update existing trip
        await tripsAPI.update(editTripId, tripData);
        addToast("Trip updated successfully!", "success");
      } else {
        // Create new trip
        await tripsAPI.create(tripData);
        addToast("Trip added successfully!", "success");
      }

      navigate("/user/trip-sheet");
    } catch (error: any) {
      console.error("Error saving trip:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to save trip";
      addToast(errorMessage, "error");
    }
  };

  if (loadingConfig || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/user/trip-sheet")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
          <FileText className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Edit Trip" : "Add New Trip"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? "Update trip details" : "Record a new trip entry"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date - Top Left */}
          <div className="w-fit">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
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
                Trip ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tripId"
                value={formData.tripId}
                onChange={handleInputChange}
                placeholder="e.g., TR001"
                className={`input ${errors.tripId ? "border-red-500" : ""}`}
              />
              {errors.tripId && (
                <p className="text-red-500 text-sm mt-1">{errors.tripId}</p>
              )}
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Type <span className="text-red-500">*</span>
              </label>
              <select
                name="tripType"
                value={formData.tripType}
                onChange={handleInputChange}
                className={`input ${errors.tripType ? "border-red-500" : ""}`}
              >
                <option value="">Select trip type</option>
                {tripTypes.map((type) => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.tripType && (
                <p className="text-red-500 text-sm mt-1">{errors.tripType}</p>
              )}
            </div>

            {/* Source Point */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sourcePoint"
                value={formData.sourcePoint}
                onChange={handleInputChange}
                placeholder="Starting location"
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
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="Ending location"
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
              label="Start Time"
              error={errors.startTime}
            />

            {/* End Time */}
            <AnalogueClockPicker
              value={formData.endTime}
              period={formData.endPeriod}
              onChange={(time) =>
                setFormData((prev) => ({ ...prev, endTime: time }))
              }
              onPeriodChange={(period) =>
                setFormData((prev) => ({ ...prev, endPeriod: period }))
              }
              label="End Time"
              error={errors.endTime}
            />

            {/* Total Kilometers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Kilometers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalKilometers"
                value={formData.totalKilometers}
                onChange={handleInputChange}
                placeholder="0.00"
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

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`input ${errors.amount ? "border-red-500" : ""}`}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method._id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expenses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expenses (Fuel, Tolls, etc.)
              </label>
              <input
                type="number"
                name="expenses"
                value={formData.expenses}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`input ${errors.expenses ? "border-red-500" : ""}`}
              />
              {errors.expenses && (
                <p className="text-red-500 text-sm mt-1">{errors.expenses}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter any expenses for this trip (fuel, tolls, parking, etc.)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/user/trip-sheet")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              <span>
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Trip"
                  : "Save Trip"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

