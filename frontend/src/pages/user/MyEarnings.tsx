import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  IndianRupee,
  TrendingUp,
  Calendar,
  Car,
  FileText,
  Briefcase,
  ChevronDown,
  ArrowLeft,
  HelpCircle,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";

interface EarningsByType {
  trip_type: string;
  commission_type: string;
  commission_value: number;
  trip_count: number;
  total_gross_amount: number;
  total_expenses: number;
  total_net_amount: number;
  total_earnings: number;
  trips?: Array<{
    trip_id: string;
    date: string;
    gross_amount: number;
    expenses: number;
    net_amount: number;
    earnings: number;
  }>;
}

interface EarningsData {
  month: string;
  total_gross_amount: number;
  total_expenses: number;
  total_net_amount: number;
  total_earnings: number;
  monthly_salary: number;
  total_income: number;
  trip_count: number;
  trips_without_commission: number;
  earnings_by_type: EarningsByType[];
  summary: {
    gross_amount: number;
    expenses: number;
    net_amount: number;
    earnings_from_trips: number;
    microsoft_salary: number;
    total_income: number;
  };
}

export default function MyEarnings() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, [selectedMonth]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/earnings/my-earnings?month=${selectedMonth}`);
      setEarningsData(response.data);
    } catch (error: any) {
      console.error("Error fetching earnings:", error);
      addToast("Failed to load earnings data", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTypeExpansion = (tripType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(tripType)) {
      newExpanded.delete(tripType);
    } else {
      newExpanded.add(tripType);
    }
    setExpandedTypes(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No earnings data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Microsoft Blue */}
            <div className="sticky top-0 text-white p-6 rounded-t-xl flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)' }}>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="w-7 h-7" />
                How Your Earnings Are Calculated
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Calculation Steps - Microsoft Colors */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg border-2" style={{ background: 'rgba(0, 164, 239, 0.1)', borderColor: '#00A4EF' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-md" style={{ background: '#00A4EF' }}>
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Gross Amount</h3>
                    <p className="text-gray-600">Total collected from customer</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border-2" style={{ background: 'rgba(242, 80, 34, 0.1)', borderColor: '#F25022' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-md" style={{ background: '#F25022' }}>
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Expenses</h3>
                    <p className="text-gray-600">Fuel, tolls, parking, etc.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border-2" style={{ background: 'rgba(255, 185, 0, 0.15)', borderColor: '#FFB900' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-md" style={{ background: '#FFB900' }}>
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Net Amount</h3>
                    <p className="text-gray-600">Gross - Expenses</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border-2" style={{ background: 'rgba(127, 186, 0, 0.1)', borderColor: '#7FBA00' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-md" style={{ background: '#7FBA00' }}>
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Your Earnings</h3>
                    <p className="text-gray-600">Commission calculated on Net Amount</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border-2" style={{ background: 'rgba(0, 120, 212, 0.1)', borderColor: '#0078D4' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 shadow-md" style={{ background: '#0078D4' }}>
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">Salary</h3>
                    <p className="text-gray-600">Fixed monthly from Microsoft</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-lg border-2" style={{ background: 'linear-gradient(135deg, rgba(127, 186, 0, 0.15) 0%, rgba(0, 164, 239, 0.1) 100%)', borderColor: '#7FBA00' }}>
                  <div className="text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl flex-shrink-0 shadow-md" style={{ background: '#7FBA00' }}>
                    💰
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-xl" style={{ color: '#7FBA00' }}>Total Income</h3>
                    <p className="font-semibold" style={{ color: '#6DA000' }}>Earnings + Salary</p>
                  </div>
                </div>
              </div>

              {/* Example - Microsoft Colors */}
              <div className="p-5 rounded-lg border-2" style={{ 
                background: 'linear-gradient(135deg, rgba(0, 164, 239, 0.1) 0%, rgba(127, 186, 0, 0.1) 100%)',
                borderColor: '#00A4EF'
              }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span> Example Calculation
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(0, 164, 239, 0.1)' }}>
                    <span className="font-medium text-gray-700">Gross Amount:</span>
                    <span className="font-bold" style={{ color: '#00A4EF' }}>₹980</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(242, 80, 34, 0.1)' }}>
                    <span className="font-medium text-gray-700">Expenses:</span>
                    <span className="font-bold" style={{ color: '#F25022' }}>- ₹120</span>
                  </div>
                  <div className="h-px my-2" style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #F25022 50%, #FFB900 100%)' }}></div>
                  <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255, 185, 0, 0.15)' }}>
                    <span className="font-medium text-gray-700">Net Amount:</span>
                    <span className="font-bold" style={{ color: '#FFB900' }}>₹860</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                    <span className="font-medium text-gray-700">Commission (20%):</span>
                    <span className="text-gray-900 font-semibold">20% × ₹860</span>
                  </div>
                  <div className="h-px my-2" style={{ background: 'linear-gradient(90deg, #FFB900 0%, #7FBA00 100%)' }}></div>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(127, 186, 0, 0.15)' }}>
                    <span className="font-bold text-gray-900 text-base">Your Earnings:</span>
                    <span className="font-bold text-2xl" style={{ color: '#7FBA00' }}>₹172</span>
                  </div>
                </div>
              </div>

              {/* Close Button - Microsoft Green */}
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full text-white py-3 rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(90deg, #7FBA00 0%, #6DA000 100%)' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

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
              <IndianRupee className="w-8 h-8" style={{ color: '#7FBA00' }} />
              My Earnings
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-full transition-all shadow-sm hover:shadow-md"
                style={{ background: 'rgba(0, 164, 239, 0.15)' }}
                title="How are earnings calculated?"
              >
                <HelpCircle className="w-6 h-6" style={{ color: '#00A4EF' }} />
              </button>
            </h1>
            <p className="text-gray-600 mt-1">Track your income and commissions</p>
          </div>
        </div>

        {/* Month Selector */}
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

      {/* Summary Cards - Microsoft Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Gross Amount - Microsoft Blue */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <Car className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Gross Amount</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.gross_amount.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">
            Total collected from trips
          </p>
        </div>

        {/* Expenses - Microsoft Red */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #F25022 0%, #D13C18 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-80 transform rotate-180" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Expenses</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.expenses.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">Fuel, tolls, etc.</p>
        </div>

        {/* Net Amount - Microsoft Yellow */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #FFB900 0%, #F59E00 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <IndianRupee className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Net Amount</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.net_amount.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">Gross - Expenses</p>
        </div>
      </div>

      {/* Earnings & Income Cards - Microsoft Colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Earnings from Trips - Microsoft Green */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #7FBA00 0%, #6DA000 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <IndianRupee className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Your Earnings</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.earnings_from_trips.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">Commission on net amount</p>
        </div>

        {/* Microsoft Salary - Microsoft Blue Variant */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="w-8 h-8 opacity-90" />
            <IndianRupee className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Monthly Salary</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.microsoft_salary.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">Microsoft duties</p>
        </div>

        {/* Total Income - Microsoft Purple */}
        <div className="rounded-xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #8661C5 0%, #6B4EA3 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <IndianRupee className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Income</h3>
          <p className="text-3xl font-bold mb-2">
            ₹{earningsData.summary.total_income.toLocaleString()}
          </p>
          <p className="text-xs opacity-80">Earnings + Salary</p>
        </div>
      </div>

      {/* Earnings Breakdown by Trip Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Earnings Breakdown by Trip Type
        </h2>

        {earningsData.earnings_by_type.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-900 text-xl font-bold mb-2">No trip sheet earnings this month</p>
            <p className="text-sm text-gray-600 mb-4">
              Start recording trips to see your earnings here
            </p>
            <button
              onClick={() => navigate("/user/add-trip")}
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(90deg, #7FBA00 0%, #6DA000 100%)' }}
            >
              <Plus className="w-5 h-5" />
              Add Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {earningsData.earnings_by_type.map((typeEarnings) => {
              const isExpanded = expandedTypes.has(typeEarnings.trip_type);

              return (
                <div
                  key={typeEarnings.trip_type}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-md border-2"
                  style={{ borderColor: '#00A4EF' }}
                >
                  {/* Type Header - Microsoft Style */}
                  <button
                    onClick={() => toggleTypeExpansion(typeEarnings.trip_type)}
                    className="w-full px-5 py-5 transition-all flex items-center justify-between"
                    style={{ 
                      background: isExpanded 
                        ? 'linear-gradient(90deg, rgba(0, 164, 239, 0.1) 0%, rgba(127, 186, 0, 0.05) 100%)'
                        : 'linear-gradient(90deg, rgba(0, 164, 239, 0.05) 0%, rgba(127, 186, 0, 0.03) 100%)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)' }}>
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900 text-xl mb-2">
                          {typeEarnings.trip_type}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ background: '#00A4EF' }}>
                            {typeEarnings.trip_count} {typeEarnings.trip_count === 1 ? "trip" : "trips"}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {typeEarnings.commission_type === "amount"
                              ? `₹${typeEarnings.commission_value} per trip`
                              : `${typeEarnings.commission_value}% commission`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-xs mb-2 flex-wrap">
                          <div className="px-3 py-1.5 rounded-lg font-semibold text-white shadow-sm" style={{ background: '#00A4EF' }}>
                            ₹{typeEarnings.total_gross_amount.toFixed(2)}
                          </div>
                          <span className="font-bold text-gray-400">−</span>
                          <div className="px-3 py-1.5 rounded-lg font-semibold text-white shadow-sm" style={{ background: '#F25022' }}>
                            ₹{typeEarnings.total_expenses.toFixed(2)}
                          </div>
                          <span className="font-bold text-gray-400">=</span>
                          <div className="px-3 py-1.5 rounded-lg font-semibold text-white shadow-sm" style={{ background: '#FFB900' }}>
                            ₹{typeEarnings.total_net_amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-medium text-gray-600">You Earned:</span>
                          <p className="text-2xl font-bold" style={{ color: '#7FBA00' }}>
                            ₹{typeEarnings.total_earnings.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 164, 239, 0.1)' }}>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          style={{ color: '#00A4EF' }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Trip Details */}
                  {isExpanded && typeEarnings.trips && (
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 border-t border-gray-200">
                      <div className="space-y-3">
                        {typeEarnings.trips.map((trip, index) => (
                          <div
                            key={trip.trip_id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            {/* Trip Header - Microsoft Blue */}
                            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)' }}>
                              <div className="flex items-center gap-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                  <Car className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-lg">{trip.trip_id}</p>
                                  <p className="text-white/80 text-xs">
                                    {new Date(trip.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-white/80 mb-1">You Earned</p>
                                <p className="text-2xl font-bold text-white">
                                  ₹{trip.earnings.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Trip Details */}
                            <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50">
                              <div className="grid grid-cols-3 gap-3">
                                {/* Gross Amount - Microsoft Blue */}
                                <div className="rounded-lg p-3 border-2" style={{ 
                                  background: 'linear-gradient(135deg, rgba(0, 164, 239, 0.1) 0%, rgba(0, 164, 239, 0.05) 100%)',
                                  borderColor: '#00A4EF'
                                }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="rounded-full p-1" style={{ background: '#00A4EF' }}>
                                      <IndianRupee className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: '#00A4EF' }}>Gross</span>
                                  </div>
                                  <p className="text-lg font-bold" style={{ color: '#0078D4' }}>
                                    ₹{trip.gross_amount.toFixed(2)}
                                  </p>
                                </div>

                                {/* Expenses - Microsoft Red */}
                                <div className="rounded-lg p-3 border-2" style={{ 
                                  background: 'linear-gradient(135deg, rgba(242, 80, 34, 0.1) 0%, rgba(242, 80, 34, 0.05) 100%)',
                                  borderColor: '#F25022'
                                }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="rounded-full p-1" style={{ background: '#F25022' }}>
                                      <Minus className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: '#F25022' }}>Expenses</span>
                                  </div>
                                  <p className="text-lg font-bold" style={{ color: '#D13C18' }}>
                                    ₹{trip.expenses.toFixed(2)}
                                  </p>
                                </div>

                                {/* Net Amount - Microsoft Yellow */}
                                <div className="rounded-lg p-3 border-2" style={{ 
                                  background: 'linear-gradient(135deg, rgba(255, 185, 0, 0.15) 0%, rgba(255, 185, 0, 0.05) 100%)',
                                  borderColor: '#FFB900'
                                }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="rounded-full p-1" style={{ background: '#FFB900' }}>
                                      <IndianRupee className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: '#F59E00' }}>Net</span>
                                  </div>
                                  <p className="text-lg font-bold" style={{ color: '#D68400' }}>
                                    ₹{trip.net_amount.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Calculation Formula - Microsoft Green */}
                              <div className="mt-3 p-3 rounded-lg border-2" style={{ 
                                background: 'linear-gradient(135deg, rgba(127, 186, 0, 0.1) 0%, rgba(127, 186, 0, 0.05) 100%)',
                                borderColor: '#7FBA00'
                              }}>
                                <p className="text-xs font-medium" style={{ color: '#6DA000' }}>
                                  <span className="font-bold">Commission:</span> {typeEarnings.commission_value}
                                  {typeEarnings.commission_type === "percentage" ? "%" : " ₹"} 
                                  {typeEarnings.commission_type === "percentage" 
                                    ? ` × ₹${trip.net_amount.toFixed(2)} (Net) = ₹${trip.earnings.toFixed(2)}`
                                    : " per trip"
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Warning for trips without commission */}
        {earningsData.trips_without_commission > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>{earningsData.trips_without_commission}</strong> trip{earningsData.trips_without_commission > 1 ? "s" : ""} without commission settings
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              These trips don't have commission configured for their trip type.
              Contact your administrator to set commission rates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

