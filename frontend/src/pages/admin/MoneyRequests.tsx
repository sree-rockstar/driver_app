import { useState, useEffect } from "react";
import {
  Wallet,
  IndianRupee,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Save,
  X as XIcon,
} from "lucide-react";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";

interface MoneyRequest {
  _id: string;
  user_id: string;
  request_type: string;
  amount: number;
  reason?: string;
  status: string;
  month: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
  user_info?: {
    full_name?: string;
    mobile_number?: string;
  };
}

export default function AdminMoneyRequests() {
  const { addToast } = useToastStore();
  const [allRequests, setAllRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Fetch all requests without filter to calculate stats
      const response = await api.get("/money-requests/admin/requests");
      console.log("API Response:", response);
      console.log("Fetched requests data:", response.data);
      console.log("Number of requests:", response.data?.length || 0);
      setAllRequests(response.data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      console.error("Error details:", error.response?.data);
      addToast(error.response?.data?.detail || "Failed to load requests", "error");
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: string,
    notes?: string
  ) => {
    try {
      await api.put(`/money-requests/admin/requests/${requestId}`, {
        status: newStatus,
        admin_notes: notes || undefined,
      });
      addToast(`Request ${newStatus} successfully`, "success");
      setProcessingRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error updating request:", error);
      addToast("Failed to update request", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFB900"; // Microsoft Yellow
      case "approved":
        return "#7FBA00"; // Microsoft Green
      case "paid":
        return "#00A4EF"; // Microsoft Blue
      case "rejected":
        return "#F25022"; // Microsoft Red
      default:
        return "#6B7280";
    }
  };

  const getRequestTypeColor = (type: string) => {
    return type === "advance" ? "#00A4EF" : "#7FBA00";
  };

  const getRequestTypeLabel = (type: string) => {
    return type === "advance" ? "Salary Advance" : "Earnings Withdrawal";
  };

  // Filter requests based on selected status
  const filteredRequests = statusFilter 
    ? allRequests.filter((r) => r.status === statusFilter)
    : allRequests;

  const statusCounts = {
    all: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    paid: allRequests.filter((r) => r.status === "paid").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  };

  console.log("Status Filter:", statusFilter);
  console.log("All Requests Count:", allRequests.length);
  console.log("Status Counts:", statusCounts);
  console.log("Filtered Requests Count:", filteredRequests.length);

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
          <Wallet className="w-8 h-8" style={{ color: "#7FBA00" }} />
          Money Requests
        </h1>
        <p className="text-gray-600 mt-2">
          Manage driver advance and withdrawal requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          className="rounded-lg p-4 text-white cursor-pointer transition-all hover:shadow-md"
          style={{
            background:
              statusFilter === ""
                ? "linear-gradient(135deg, #0078D4 0%, #005A9E 100%)"
                : "rgba(0, 120, 212, 0.7)",
          }}
          onClick={() => setStatusFilter("")}
        >
          <p className="text-sm opacity-90">All Requests</p>
          <p className="text-3xl font-bold">{statusCounts.all}</p>
        </div>

        <div
          className="rounded-lg p-4 text-white cursor-pointer transition-all hover:shadow-md"
          style={{
            background:
              statusFilter === "pending"
                ? "linear-gradient(135deg, #FFB900 0%, #F59E00 100%)"
                : "rgba(255, 185, 0, 0.7)",
          }}
          onClick={() => setStatusFilter("pending")}
        >
          <p className="text-sm opacity-90">Pending</p>
          <p className="text-3xl font-bold">{statusCounts.pending}</p>
        </div>

        <div
          className="rounded-lg p-4 text-white cursor-pointer transition-all hover:shadow-md"
          style={{
            background:
              statusFilter === "approved"
                ? "linear-gradient(135deg, #7FBA00 0%, #6DA000 100%)"
                : "rgba(127, 186, 0, 0.7)",
          }}
          onClick={() => setStatusFilter("approved")}
        >
          <p className="text-sm opacity-90">Approved</p>
          <p className="text-3xl font-bold">{statusCounts.approved}</p>
        </div>

        <div
          className="rounded-lg p-4 text-white cursor-pointer transition-all hover:shadow-md"
          style={{
            background:
              statusFilter === "paid"
                ? "linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)"
                : "rgba(0, 164, 239, 0.7)",
          }}
          onClick={() => setStatusFilter("paid")}
        >
          <p className="text-sm opacity-90">Paid</p>
          <p className="text-3xl font-bold">{statusCounts.paid}</p>
        </div>

        <div
          className="rounded-lg p-4 text-white cursor-pointer transition-all hover:shadow-md"
          style={{
            background:
              statusFilter === "rejected"
                ? "linear-gradient(135deg, #F25022 0%, #D13C18 100%)"
                : "rgba(242, 80, 34, 0.7)",
          }}
          onClick={() => setStatusFilter("rejected")}
        >
          <p className="text-sm opacity-90">Rejected</p>
          <p className="text-3xl font-bold">{statusCounts.rejected}</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {allRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 p-12 text-center" style={{ borderColor: '#00A4EF' }}>
            <div className="bg-gradient-to-br from-blue-100 to-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-gray-900 text-2xl font-bold mb-2">No money requests yet</p>
            <p className="text-gray-600 mb-4">
              Money requests from drivers will appear here
            </p>
            <div className="max-w-md mx-auto space-y-3 text-left bg-blue-50 p-5 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 font-semibold mb-2">How it works:</p>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Drivers request advance on salary or withdraw earnings</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Requests appear here for admin review</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-600 font-bold">3.</span>
                <span>You can approve/reject and track payments</span>
              </div>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No {statusFilter} requests</p>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different status filter
            </p>
            <button
              onClick={() => setStatusFilter("")}
              className="mt-4 px-4 py-2 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)' }}
            >
              Show All Requests
            </button>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all"
              style={{
                borderColor: getRequestTypeColor(request.request_type),
              }}
            >
              {/* Request Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{
                  background: `linear-gradient(90deg, ${getRequestTypeColor(
                    request.request_type
                  )}15 0%, ${getRequestTypeColor(request.request_type)}05 100%)`,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div
                    className="p-3 rounded-xl shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${getRequestTypeColor(
                        request.request_type
                      )} 0%, ${getRequestTypeColor(request.request_type)}DD 100%)`,
                    }}
                  >
                    {request.request_type === "advance" ? (
                      <IndianRupee className="w-6 h-6 text-white" />
                    ) : (
                      <Wallet className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Request Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 text-xl">
                        ₹{request.amount.toLocaleString()}
                      </h3>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          background: getRequestTypeColor(request.request_type),
                        }}
                      >
                        {getRequestTypeLabel(request.request_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {request.user_info?.full_name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(request.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{request.user_info?.mobile_number}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold shadow-sm"
                  style={{ background: getStatusColor(request.status) }}
                >
                  {request.status === "pending" && <Clock className="w-4 h-4" />}
                  {(request.status === "approved" || request.status === "paid") && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {request.status === "rejected" && <XCircle className="w-4 h-4" />}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>
              </div>

              {/* Request Details */}
              <div className="px-5 py-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div>
                    {request.reason && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Driver's Reason:
                        </p>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Admin Note:</p>
                        <p
                          className="text-sm font-medium p-3 rounded-lg border-2"
                          style={{
                            background:
                              request.status === "rejected"
                                ? "rgba(242, 80, 34, 0.1)"
                                : "rgba(127, 186, 0, 0.1)",
                            borderColor:
                              request.status === "rejected" ? "#F25022" : "#7FBA00",
                            color:
                              request.status === "rejected" ? "#D13C18" : "#6DA000",
                          }}
                        >
                          {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Actions */}
                  <div>
                    {request.status === "pending" && (
                      <div>
                        {processingRequest === request._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes (optional)..."
                              rows={3}
                              className="input w-full text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    request._id,
                                    "approved",
                                    adminNotes
                                  )
                                }
                                className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #7FBA00 0%, #6DA000 100%)",
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    request._id,
                                    "rejected",
                                    adminNotes
                                  )
                                }
                                className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #F25022 0%, #D13C18 100%)",
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setProcessingRequest(null);
                                  setAdminNotes("");
                                }}
                                className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setProcessingRequest(request._id)}
                            className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                            style={{
                              background:
                                "linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)",
                            }}
                          >
                            <Save className="w-5 h-5" />
                            Process Request
                          </button>
                        )}
                      </div>
                    )}

                    {request.status === "approved" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(request._id, "paid", request.admin_notes)
                        }
                        className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                        style={{
                          background:
                            "linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)",
                        }}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Paid
                      </button>
                    )}

                    {(request.status === "paid" || request.status === "rejected") && (
                      <div
                        className="p-4 rounded-lg text-center"
                        style={{
                          background:
                            request.status === "paid"
                              ? "rgba(0, 164, 239, 0.1)"
                              : "rgba(242, 80, 34, 0.1)",
                          color:
                            request.status === "paid" ? "#0078D4" : "#D13C18",
                        }}
                      >
                        <p className="font-semibold">
                          {request.status === "paid"
                            ? "✓ Payment Completed"
                            : "✗ Request Rejected"}
                        </p>
                        {request.processed_at && (
                          <p className="text-xs mt-1 opacity-80">
                            {new Date(request.processed_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

