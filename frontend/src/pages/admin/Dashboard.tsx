import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../lib/api'
import { Users, Car, Activity, TrendingUp, ArrowRight, Truck, Zap, AlertCircle, Wrench, FileText, DollarSign, Battery, CheckCircle, Clock, Wallet, IndianRupee } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await adminAPI.getStats()
      return data
    },
  })

  // Fetch fleet statistics
  const { data: fleetStats } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: async () => {
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/vehicles/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    },
    enabled: !!token
  })

  // Fetch fleet dashboard analytics
  const { data: dashboardAnalytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/vehicles/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    },
    enabled: !!token
  })

  // Fetch money requests stats
  const { data: moneyRequests } = useQuery({
    queryKey: ['money-requests-all'],
    queryFn: async () => {
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/money-requests/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    },
    enabled: !!token
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin/users',
    },
    {
      title: 'Total Drivers',
      value: stats?.total_drivers || 0,
      icon: Car,
      color: 'bg-green-100 text-green-600',
      href: '/admin/drivers',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
      href: '/admin/users',
    },
    {
      title: 'Statuses',
      value: '5',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      href: '/admin/statuses',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Complete overview of your fleet and operations</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.href)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Money Requests Section */}
      {moneyRequests && moneyRequests.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-6 h-6" style={{ color: '#7FBA00' }} />
              Money Requests
            </h2>
            <button
              onClick={() => navigate('/admin/money-requests')}
              className="text-sm font-medium flex items-center gap-1 px-4 py-2 rounded-lg transition-colors text-white shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(90deg, #00A4EF 0%, #0078D4 100%)' }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Pending Requests */}
            <div
              className="rounded-xl shadow-md p-5 text-white cursor-pointer hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #FFB900 0%, #F59E00 100%)' }}
              onClick={() => navigate('/admin/money-requests')}
            >
              <Clock className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Pending</p>
              <p className="text-4xl font-bold">
                {moneyRequests?.filter((r: any) => r.status === 'pending').length || 0}
              </p>
            </div>

            {/* Approved Requests */}
            <div
              className="rounded-xl shadow-md p-5 text-white cursor-pointer hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #7FBA00 0%, #6DA000 100%)' }}
              onClick={() => navigate('/admin/money-requests')}
            >
              <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Approved</p>
              <p className="text-4xl font-bold">
                {moneyRequests?.filter((r: any) => r.status === 'approved').length || 0}
              </p>
            </div>

            {/* Paid Requests */}
            <div
              className="rounded-xl shadow-md p-5 text-white cursor-pointer hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)' }}
              onClick={() => navigate('/admin/money-requests')}
            >
              <IndianRupee className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Paid</p>
              <p className="text-4xl font-bold">
                {moneyRequests?.filter((r: any) => r.status === 'paid').length || 0}
              </p>
            </div>

            {/* Total Amount Pending */}
            <div
              className="rounded-xl shadow-md p-5 text-white cursor-pointer hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #F25022 0%, #D13C18 100%)' }}
              onClick={() => navigate('/admin/money-requests')}
            >
              <Wallet className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Pending Amount</p>
              <p className="text-2xl font-bold">
                ₹{(moneyRequests?.filter((r: any) => r.status === 'pending')
                  .reduce((sum: number, r: any) => sum + r.amount, 0) || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Management Section */}
      {fleetStats && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-6 h-6" />
              Fleet Management
            </h2>
          </div>

          {/* Fleet Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/fleet')}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{fleetStats.total_vehicles}</p>
              <p className="text-xs text-gray-500 mt-1">Click to view fleet</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Available</p>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{fleetStats.by_status?.available || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Ready for assignment</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">In Use</p>
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{fleetStats.by_status?.in_use || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Electric Vehicles</p>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">{fleetStats.by_fuel_type?.electric || 0}</p>
              <p className="text-xs text-gray-500 mt-1">EV fleet size</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Maintenance</p>
                <Wrench className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{fleetStats.by_status?.maintenance || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Under service</p>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Document Expiry Alerts */}
            {(fleetStats.alerts?.insurance_expiring_soon > 0 || fleetStats.alerts?.insurance_expired > 0) && (
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Insurance Alerts</p>
                    <p className="text-sm text-red-700 mt-1">
                      {fleetStats.alerts.insurance_expired > 0 && (
                        <span className="block">⚠️ {fleetStats.alerts.insurance_expired} expired</span>
                      )}
                      {fleetStats.alerts.insurance_expiring_soon > 0 && (
                        <span className="block">⚠️ {fleetStats.alerts.insurance_expiring_soon} expiring soon</span>
                      )}
                    </p>
                    <button className="text-xs text-red-600 font-semibold mt-2 hover:underline">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Charging Status (if EVs exist) */}
            {fleetStats.by_status?.charging > 0 && (
              <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-semibold text-purple-900">Charging Now</p>
                    <p className="text-sm text-purple-700 mt-1">
                      {fleetStats.by_status.charging} vehicle(s) charging
                    </p>
                    <button className="text-xs text-purple-600 font-semibold mt-2 hover:underline">
                      View EV Fleet →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fleet Health */}
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Fleet Health</p>
                  <p className="text-sm text-green-700 mt-1">
                    {((fleetStats.by_status?.available + fleetStats.by_status?.in_use) / fleetStats.total_vehicles * 100).toFixed(0)}% operational
                  </p>
                  <button className="text-xs text-green-600 font-semibold mt-2 hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Dashboard */}
      {dashboardAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Recent Activity (Last 7 Days)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">New Vehicles Added</span>
                <span className="font-bold text-indigo-600">{dashboardAnalytics.recent_activity?.new_vehicles || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Assignments Made</span>
                <span className="font-bold text-blue-600">{dashboardAnalytics.recent_activity?.new_assignments || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Charging Sessions</span>
                <span className="font-bold text-purple-600">{dashboardAnalytics.recent_activity?.charging_sessions || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Maintenance Scheduled</span>
                <span className="font-bold text-yellow-600">{dashboardAnalytics.recent_activity?.maintenance_scheduled || 0}</span>
              </div>
            </div>
          </div>

          {/* Costs This Month */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Costs This Month
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Total Expenses</span>
                <span className="font-bold text-gray-900">
                  ₹{dashboardAnalytics.costs_this_month?.total?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Fuel Costs</span>
                <span className="font-bold text-blue-600">
                  ₹{dashboardAnalytics.costs_this_month?.fuel?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">Charging Costs</span>
                <span className="font-bold text-purple-600">
                  ₹{dashboardAnalytics.costs_this_month?.charging?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700">Maintenance Costs</span>
                <span className="font-bold text-yellow-600">
                  ₹{dashboardAnalytics.costs_this_month?.maintenance?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/fleet')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Truck className="w-6 h-6 text-indigo-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">Manage Fleet</p>
          <p className="text-sm text-gray-600 mt-1">View and manage all vehicles</p>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">View All Users</p>
          <p className="text-sm text-gray-600 mt-1">User management</p>
        </button>

        <button
          onClick={() => navigate('/admin/drivers')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-full">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">Manage Drivers</p>
          <p className="text-sm text-gray-600 mt-1">Driver operations</p>
        </button>

        <button
          onClick={() => navigate('/admin/trips')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">View Trips</p>
          <p className="text-sm text-gray-600 mt-1">Trip management</p>
        </button>

        <button
          onClick={() => navigate('/admin/statuses')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
          <p className="font-semibold text-gray-900 text-lg">View Statuses</p>
          <p className="text-sm text-gray-600 mt-1">Status management</p>
        </button>

        {/* Document Alerts Action */}
        {fleetStats && (fleetStats.alerts?.insurance_expiring_soon > 0 || fleetStats.alerts?.insurance_expired > 0) && (
          <button
            className="bg-white p-6 rounded-lg shadow-md border-2 border-red-300 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="font-semibold text-gray-900 text-lg">Expiring Documents</p>
            <p className="text-sm text-red-600 mt-1 font-semibold">
              {(fleetStats.alerts.insurance_expiring_soon + fleetStats.alerts.insurance_expired)} alerts
            </p>
          </button>
        )}
      </div>
    </div>
  )
}


