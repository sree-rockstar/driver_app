import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Settings,
  CreditCard,
  Car,
  DollarSign,
  IndianRupee,
  Percent,
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { api } from "../../lib/api";

interface TripType {
  _id: string;
  name: string;
  is_active: boolean;
  commission_type?: "amount" | "percentage";
  commission_value?: number;
}

interface PaymentMethod {
  _id: string;
  name: string;
  is_active: boolean;
}

export default function TripConfig() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Trip Type states
  const [editingTripType, setEditingTripType] = useState<string | null>(null);
  const [newTripTypeName, setNewTripTypeName] = useState("");
  const [editTripTypeName, setEditTripTypeName] = useState("");
  const [showAddTripType, setShowAddTripType] = useState(false);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionType, setCommissionType] = useState<"amount" | "percentage">("amount");
  const [commissionValue, setCommissionValue] = useState<string>("");

  // Payment Method states
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string | null>(null);
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
  const [editPaymentMethodName, setEditPaymentMethodName] = useState("");
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripTypesRes, paymentMethodsRes] = await Promise.all([
        api.get("/trip-types?include_inactive=true"),
        api.get("/payment-methods?include_inactive=true"),
      ]);
      setTripTypes(tripTypesRes.data);
      setPaymentMethods(paymentMethodsRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      addToast("Failed to load configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trip Type functions
  const handleAddTripType = async () => {
    if (!newTripTypeName.trim()) {
      addToast("Please enter a trip type name", "error");
      return;
    }

    try {
      await api.post("/trip-types", { name: newTripTypeName, is_active: true });
      addToast("Trip type added successfully", "success");
      setNewTripTypeName("");
      setShowAddTripType(false);
      fetchData();
    } catch (error: any) {
      console.error("Error adding trip type:", error);
      addToast(
        error.response?.data?.detail || "Failed to add trip type",
        "error"
      );
    }
  };

  const handleUpdateTripType = async (id: string) => {
    if (!editTripTypeName.trim()) {
      addToast("Please enter a trip type name", "error");
      return;
    }

    try {
      await api.put(`/trip-types/${id}`, { name: editTripTypeName });
      addToast("Trip type updated successfully", "success");
      setEditingTripType(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating trip type:", error);
      addToast(
        error.response?.data?.detail || "Failed to update trip type",
        "error"
      );
    }
  };

  const handleToggleTripTypeStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/trip-types/${id}`, { is_active: !currentStatus });
      addToast(
        `Trip type ${!currentStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
      fetchData();
    } catch (error: any) {
      console.error("Error toggling trip type status:", error);
      addToast("Failed to update trip type status", "error");
    }
  };

  const handleDeleteTripType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trip type?")) return;

    try {
      await api.delete(`/trip-types/${id}`);
      addToast("Trip type deleted successfully", "success");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting trip type:", error);
      addToast("Failed to delete trip type", "error");
    }
  };

  const handleStartEditCommission = (tripType: TripType) => {
    setEditingCommission(tripType._id);
    setCommissionType(tripType.commission_type || "amount");
    setCommissionValue(tripType.commission_value?.toString() || "");
  };

  const handleSaveCommission = async (id: string) => {
    const value = parseFloat(commissionValue);
    if (isNaN(value) || value < 0) {
      addToast("Please enter a valid commission value", "error");
      return;
    }

    if (commissionType === "percentage" && value > 100) {
      addToast("Percentage cannot exceed 100%", "error");
      return;
    }

    try {
      await api.put(`/trip-types/${id}`, {
        commission_type: commissionType,
        commission_value: value,
      });
      addToast("Commission updated successfully", "success");
      setEditingCommission(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating commission:", error);
      addToast("Failed to update commission", "error");
    }
  };

  const handleCancelCommissionEdit = () => {
    setEditingCommission(null);
    setCommissionValue("");
  };

  // Payment Method functions
  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethodName.trim()) {
      addToast("Please enter a payment method name", "error");
      return;
    }

    try {
      await api.post("/payment-methods", {
        name: newPaymentMethodName,
        is_active: true,
      });
      addToast("Payment method added successfully", "success");
      setNewPaymentMethodName("");
      setShowAddPaymentMethod(false);
      fetchData();
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      addToast(
        error.response?.data?.detail || "Failed to add payment method",
        "error"
      );
    }
  };

  const handleUpdatePaymentMethod = async (id: string) => {
    if (!editPaymentMethodName.trim()) {
      addToast("Please enter a payment method name", "error");
      return;
    }

    try {
      await api.put(`/payment-methods/${id}`, { name: editPaymentMethodName });
      addToast("Payment method updated successfully", "success");
      setEditingPaymentMethod(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      addToast(
        error.response?.data?.detail || "Failed to update payment method",
        "error"
      );
    }
  };

  const handleTogglePaymentMethodStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      await api.put(`/payment-methods/${id}`, { is_active: !currentStatus });
      addToast(
        `Payment method ${
          !currentStatus ? "activated" : "deactivated"
        } successfully`,
        "success"
      );
      fetchData();
    } catch (error: any) {
      console.error("Error toggling payment method status:", error);
      addToast("Failed to update payment method status", "error");
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?"))
      return;

    try {
      await api.delete(`/payment-methods/${id}`);
      addToast("Payment method deleted successfully", "success");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      addToast("Failed to delete payment method", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Trip Configuration
        </h1>
        <p className="text-gray-600 mt-2">
          Manage trip types and payment methods
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Types Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-600" />
              Trip Types
            </h2>
            <button
              onClick={() => setShowAddTripType(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          {/* Add New Trip Type Form */}
          {showAddTripType && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTripTypeName}
                  onChange={(e) => setNewTripTypeName(e.target.value)}
                  placeholder="Enter trip type name"
                  className="input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddTripType();
                  }}
                />
                <button
                  onClick={handleAddTripType}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowAddTripType(false);
                    setNewTripTypeName("");
                  }}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Trip Types List */}
          <div className="space-y-2">
            {tripTypes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No trip types added yet
              </p>
            ) : (
              tripTypes.map((tripType) => (
                <div
                  key={tripType._id}
                  className={`p-4 rounded-lg border ${
                    tripType.is_active
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-300"
                  }`}
                >
                  {/* Trip Type Name Row */}
                  <div className="flex items-center gap-3 mb-3">
                    {editingTripType === tripType._id ? (
                      <>
                        <input
                          type="text"
                          value={editTripTypeName}
                          onChange={(e) => setEditTripTypeName(e.target.value)}
                          className="input flex-1"
                          onKeyPress={(e) => {
                            if (e.key === "Enter")
                              handleUpdateTripType(tripType._id);
                          }}
                        />
                        <button
                          onClick={() => handleUpdateTripType(tripType._id)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTripType(null)}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex-1 font-bold text-lg ${
                            tripType.is_active ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {tripType.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleTripTypeStatus(
                                tripType._id,
                                tripType.is_active
                              )
                            }
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              tripType.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {tripType.is_active ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingTripType(tripType._id);
                              setEditTripTypeName(tripType.name);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTripType(tripType._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Commission Settings */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Driver Commission
                      </span>
                      {editingCommission !== tripType._id && (
                        <button
                          onClick={() => handleStartEditCommission(tripType)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {tripType.commission_type ? "Edit" : "Set Commission"}
                        </button>
                      )}
                    </div>

                    {editingCommission === tripType._id ? (
                      <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
                        {/* Commission Type Selection */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCommissionType("amount")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${
                              commissionType === "amount"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <IndianRupee className="w-4 h-4" />
                            Flat Amount
                          </button>
                          <button
                            onClick={() => setCommissionType("percentage")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${
                              commissionType === "percentage"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Percent className="w-4 h-4" />
                            Percentage
                          </button>
                        </div>

                        {/* Commission Value Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(e.target.value)}
                            placeholder={
                              commissionType === "amount"
                                ? "Enter amount (e.g., 50)"
                                : "Enter percentage (e.g., 10)"
                            }
                            min="0"
                            max={commissionType === "percentage" ? "100" : undefined}
                            step={commissionType === "amount" ? "1" : "0.1"}
                            className="input flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter")
                                handleSaveCommission(tripType._id);
                            }}
                          />
                          <span className="text-gray-700 font-medium">
                            {commissionType === "amount" ? "₹" : "%"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCommission(tripType._id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Save Commission
                          </button>
                          <button
                            onClick={handleCancelCommissionEdit}
                            className="px-4 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {tripType.commission_type && tripType.commission_value !== undefined ? (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            {tripType.commission_type === "amount" ? (
                              <>
                                <IndianRupee className="w-5 h-5 text-green-600" />
                                <span className="text-lg font-bold text-green-700">
                                  ₹{tripType.commission_value}
                                </span>
                                <span className="text-sm text-gray-600">per trip</span>
                              </>
                            ) : (
                              <>
                                <Percent className="w-5 h-5 text-green-600" />
                                <span className="text-lg font-bold text-green-700">
                                  {tripType.commission_value}%
                                </span>
                                <span className="text-sm text-gray-600">of trip amount</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                            No commission set
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-green-600" />
              Payment Methods
            </h2>
            <button
              onClick={() => setShowAddPaymentMethod(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          {/* Add New Payment Method Form */}
          {showAddPaymentMethod && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  placeholder="Enter payment method name"
                  className="input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddPaymentMethod();
                  }}
                />
                <button
                  onClick={handleAddPaymentMethod}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowAddPaymentMethod(false);
                    setNewPaymentMethodName("");
                  }}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Payment Methods List */}
          <div className="space-y-2">
            {paymentMethods.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No payment methods added yet
              </p>
            ) : (
              paymentMethods.map((paymentMethod) => (
                <div
                  key={paymentMethod._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    paymentMethod.is_active
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-300"
                  }`}
                >
                  {editingPaymentMethod === paymentMethod._id ? (
                    <>
                      <input
                        type="text"
                        value={editPaymentMethodName}
                        onChange={(e) =>
                          setEditPaymentMethodName(e.target.value)
                        }
                        className="input flex-1"
                        onKeyPress={(e) => {
                          if (e.key === "Enter")
                            handleUpdatePaymentMethod(paymentMethod._id);
                        }}
                      />
                      <button
                        onClick={() =>
                          handleUpdatePaymentMethod(paymentMethod._id)
                        }
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingPaymentMethod(null)}
                        className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 font-medium ${
                          paymentMethod.is_active
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {paymentMethod.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleTogglePaymentMethodStatus(
                              paymentMethod._id,
                              paymentMethod.is_active
                            )
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            paymentMethod.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {paymentMethod.is_active ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPaymentMethod(paymentMethod._id);
                            setEditPaymentMethodName(paymentMethod.name);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeletePaymentMethod(paymentMethod._id)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

