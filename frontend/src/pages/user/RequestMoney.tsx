import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  IndianRupee,
  Wallet,
  TrendingUp,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";

interface BalanceData {
  month: string;
  current_day: number;
  advance: {
    monthly_salary: number;
    working_days: number;
    working_days_passed: number;
    available: number;
    earned_so_far: number;
    max_advance_30_percent: number;
    already_advanced: number;
  };
  earnings: {
    total_earnings: number;
    already_withdrawn: number;
    available: number;
  };
}

interface MoneyRequest {
  _id: string;
  request_type: string;
  amount: number;
  reason?: string;
  status: string;
  month: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

export default function RequestMoney() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [requestType, setRequestType] = useState<"advance" | "withdrawal">("advance");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds to pick up status changes
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [balanceRes, requestsRes] = await Promise.all([
        api.get("/money-requests/available-balance"),
        api.get("/money-requests/my-requests"),
      ]);
      setBalanceData(balanceRes.data);
      setRequests(requestsRes.data);
      console.log("Balance data:", balanceRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (showLoading) addToast("Failed to load data", "error");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    addToast("Balance refreshed!", "success");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      addToast("Please enter a valid amount", "error");
      return;
    }

    const available =
      requestType === "advance"
        ? balanceData?.advance.available || 0
        : balanceData?.earnings.available || 0;

    if (requestAmount > available) {
      addToast(`Amount exceeds available balance (₹${available})`, "error");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/money-requests", {
        request_type: requestType,
        amount: requestAmount,
        reason: reason || undefined,
      });
      addToast("Money request submitted successfully!", "success");
      setAmount("");
      setReason("");
      fetchData();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      addToast(
        error.response?.data?.detail || "Failed to submit request",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#FFB900", text: "white" };
      case "approved":
        return { bg: "#7FBA00", text: "white" };
      case "paid":
        return { bg: "#00A4EF", text: "white" };
      case "rejected":
        return { bg: "#F25022", text: "white" };
      default:
        return { bg: "#6B7280", text: "white" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const advanceBalance = balanceData?.advance || {
    available: 0,
    earned_so_far: 0,
    max_advance_30_percent: 0,
    already_advanced: 0,
    monthly_salary: 0,
    working_days: 0,
    working_days_passed: 0,
  };

  const earningsBalance = balanceData?.earnings || {
    available: 0,
    total_earnings: 0,
    already_withdrawn: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-8 h-8" style={{ color: '#7FBA00' }} />
              Request Money
            </h1>
            <p className="text-gray-600 mt-1">
              Request advance on salary or withdraw earnings
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)' }}
          title="Refresh balance"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Available Balance Cards - Microsoft Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Salary Advance Balance */}
        <div
          className="rounded-xl shadow-lg p-6 text-white cursor-pointer transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)' }}
          onClick={() => setRequestType("advance")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <IndianRupee className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">
            Salary Advance Available
          </h3>
          <p className="text-4xl font-bold mb-4">
            ₹{advanceBalance.available.toLocaleString()}
          </p>
          <div className="space-y-2 text-xs opacity-90 bg-white/10 rounded-lg p-3">
            <div className="flex justify-between">
              <span>Working days passed:</span>
              <span className="font-semibold">
                {advanceBalance.working_days_passed} of {advanceBalance.working_days} days
              </span>
            </div>
            <div className="flex justify-between">
              <span>Earned so far:</span>
              <span className="font-semibold">
                ₹{advanceBalance.earned_so_far.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max advance (30%):</span>
              <span className="font-semibold">
                ₹{advanceBalance.max_advance_30_percent.toLocaleString()}
              </span>
            </div>
            {advanceBalance.already_advanced > 0 && (
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-red-200">Already advanced:</span>
                <span className="font-bold text-red-200">
                  - ₹{advanceBalance.already_advanced.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/30 pt-2 mt-2">
              <span className="font-bold">Available to request:</span>
              <span className="font-bold text-lg">
                ₹{advanceBalance.available.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings Withdrawal Balance */}
        <div
          className="rounded-xl shadow-lg p-6 text-white cursor-pointer transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #7FBA00 0%, #6DA000 100%)' }}
          onClick={() => setRequestType("withdrawal")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <Wallet className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">
            Earnings Available to Withdraw
          </h3>
          <p className="text-4xl font-bold mb-4">
            ₹{earningsBalance.available.toLocaleString()}
          </p>
          <div className="space-y-2 text-xs opacity-90 bg-white/10 rounded-lg p-3">
            <div className="flex justify-between">
              <span>Total earnings (this month):</span>
              <span className="font-semibold">
                ₹{earningsBalance.total_earnings.toLocaleString()}
              </span>
            </div>
            {earningsBalance.already_withdrawn > 0 && (
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-red-200">Already withdrawn:</span>
                <span className="font-bold text-red-200">
                  - ₹{earningsBalance.already_withdrawn.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/30 pt-2 mt-2">
              <span className="font-bold">Available to withdraw:</span>
              <span className="font-bold text-lg">
                ₹{earningsBalance.available.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-sm border-2 p-6" style={{ borderColor: '#00A4EF' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Send className="w-6 h-6" style={{ color: '#00A4EF' }} />
          Submit Request
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRequestType("advance")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  requestType === "advance"
                    ? "shadow-lg"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                style={
                  requestType === "advance"
                    ? { borderColor: '#00A4EF', background: 'rgba(0, 164, 239, 0.1)' }
                    : {}
                }
              >
                <IndianRupee
                  className="w-6 h-6 mx-auto mb-2"
                  style={{ color: requestType === "advance" ? '#00A4EF' : '#9CA3AF' }}
                />
                <p className={`font-semibold ${requestType === "advance" ? 'text-gray-900' : 'text-gray-600'}`}>
                  Salary Advance
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{advanceBalance.available.toLocaleString()} available
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRequestType("withdrawal")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  requestType === "withdrawal"
                    ? "shadow-lg"
                    : "border-gray-200 hover:border-green-300"
                }`}
                style={
                  requestType === "withdrawal"
                    ? { borderColor: '#7FBA00', background: 'rgba(127, 186, 0, 0.1)' }
                    : {}
                }
              >
                <Wallet
                  className="w-6 h-6 mx-auto mb-2"
                  style={{ color: requestType === "withdrawal" ? '#7FBA00' : '#9CA3AF' }}
                />
                <p className={`font-semibold ${requestType === "withdrawal" ? 'text-gray-900' : 'text-gray-600'}`}>
                  Earnings Withdrawal
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{earningsBalance.available.toLocaleString()} available
                </p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold text-gray-600">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                max={
                  requestType === "advance"
                    ? advanceBalance.available
                    : earningsBalance.available
                }
                step="10"
                className="input pl-8"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ₹
              {requestType === "advance"
                ? advanceBalance.available.toLocaleString()
                : earningsBalance.available.toLocaleString()}
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain why you need this money..."
              rows={3}
              className="input"
            />
          </div>

          {/* Info Box */}
          {requestType === "advance" && (
            <div className="p-4 rounded-lg border-2" style={{ background: 'rgba(0, 164, 239, 0.1)', borderColor: '#00A4EF' }}>
              <p className="text-sm" style={{ color: '#0078D4' }}>
                <strong>ℹ️ Salary Advance:</strong> You can request up to 30% of your
                earned salary for this month. You've completed{" "}
                <strong>{advanceBalance.working_days_passed}</strong> of{" "}
                <strong>{advanceBalance.working_days}</strong> working days
                {advanceBalance.working_days === 22 ? " (Mon-Fri)" : advanceBalance.working_days === 26 ? " (Mon-Sat)" : ""}.
              </p>
            </div>
          )}

          {requestType === "withdrawal" && (
            <div className="p-4 rounded-lg border-2" style={{ background: 'rgba(127, 186, 0, 0.1)', borderColor: '#7FBA00' }}>
              <p className="text-sm" style={{ color: '#6DA000' }}>
                <strong>ℹ️ Earnings Withdrawal:</strong> Withdraw your commission
                earnings from trip sheet entries. This doesn't include your Microsoft
                salary.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/user/dashboard")}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  requestType === "advance"
                    ? "linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)"
                    : "linear-gradient(90deg, #7FBA00 0%, #6DA000 100%)",
              }}
            >
              <Send className="w-5 h-5" />
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Request History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" style={{ color: '#00A4EF' }} />
          Request History
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No requests yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Your money requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusColor = getStatusColor(request.status);

              return (
                <div
                  key={request._id}
                  className="border-2 rounded-xl p-4 hover:shadow-md transition-all"
                  style={{
                    borderColor:
                      request.request_type === "advance" ? '#00A4EF' : '#7FBA00',
                    background:
                      request.request_type === "advance"
                        ? 'rgba(0, 164, 239, 0.03)'
                        : 'rgba(127, 186, 0, 0.03)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background:
                            request.request_type === "advance"
                              ? 'rgba(0, 164, 239, 0.15)'
                              : 'rgba(127, 186, 0, 0.15)',
                        }}
                      >
                        {request.request_type === "advance" ? (
                          <IndianRupee
                            className="w-5 h-5"
                            style={{ color: '#00A4EF' }}
                          />
                        ) : (
                          <Wallet className="w-5 h-5" style={{ color: '#7FBA00' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          ₹{request.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.request_type === "advance"
                            ? "Salary Advance"
                            : "Earnings Withdrawal"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-white font-semibold text-sm shadow-sm"
                      style={{ background: statusColor.bg }}
                    >
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(request.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {request.reason && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Reason:</p>
                        <p className="text-gray-900">{request.reason}</p>
                      </div>
                    )}
                    {request.admin_notes && (
                      <div className="p-3 rounded-lg" style={{ 
                        background: request.status === 'rejected' ? 'rgba(242, 80, 34, 0.1)' : 'rgba(127, 186, 0, 0.1)'
                      }}>
                        <p className="text-xs text-gray-600 mb-1">Admin Note:</p>
                        <p className="text-gray-900 font-medium">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

