import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, api } from '../../lib/api'
import { MapPin, Star, Filter, Users as UsersIcon, DollarSign, IndianRupee, Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import { useToastStore } from '../../store/toastStore'

export default function AdminDrivers() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingSalary, setEditingSalary] = useState<string | null>(null)
  const [salaryValue, setSalaryValue] = useState<string>('')
  const [workingDaysValue, setWorkingDaysValue] = useState<string>('')
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()
  
  // Since drivers are related to users, we show users who are drivers
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await adminAPI.getAllUsers()
      // Filter only users with role 'driver'
      return data.filter((user: any) => user.role === 'driver')
    },
  })

  // Mutation for updating salary
  const updateSalaryMutation = useMutation({
    mutationFn: async ({ userId, salary, workingDays }: { userId: string; salary: number; workingDays?: number }) => {
      const params: any = { monthly_salary: salary }
      if (workingDays !== undefined && workingDays > 0) {
        params.working_days = workingDays
      }
      const response = await api.put(`/admin/users/${userId}/salary`, null, { params })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('Salary updated successfully', 'success')
      setEditingSalary(null)
      setSalaryValue('')
      setWorkingDaysValue('')
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Failed to update salary', 'error')
    },
  })

  const handleStartEditSalary = (userId: string, currentSalary?: number, currentWorkingDays?: number) => {
    setEditingSalary(userId)
    setSalaryValue(currentSalary?.toString() || '')
    setWorkingDaysValue(currentWorkingDays?.toString() || '26')
  }

  const handleSaveSalary = (userId: string) => {
    const salary = parseFloat(salaryValue)
    const workingDays = workingDaysValue ? parseInt(workingDaysValue) : undefined
    
    if (isNaN(salary) || salary < 0) {
      addToast('Please enter a valid salary amount', 'error')
      return
    }
    
    if (workingDays !== undefined && (workingDays < 1 || workingDays > 31)) {
      addToast('Working days must be between 1 and 31', 'error')
      return
    }
    
    updateSalaryMutation.mutate({ userId, salary, workingDays })
  }

  const handleCancelEdit = () => {
    setEditingSalary(null)
    setSalaryValue('')
    setWorkingDaysValue('')
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading drivers...</div>
  }

  // Filter by status
  const filteredUsers = statusFilter === 'all' 
    ? users 
    : users?.filter((user: any) => user.status === statusFilter)

  // Count by status
  const statusCounts = {
    all: users?.length || 0,
    registered: users?.filter((u: any) => u.status === 'registered').length || 0,
    pending_approval: users?.filter((u: any) => u.status === 'pending_approval').length || 0,
    active: users?.filter((u: any) => u.status === 'active').length || 0,
    inactive: users?.filter((u: any) => u.status === 'inactive').length || 0,
    deactivated: users?.filter((u: any) => u.status === 'deactivated').length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
        <p className="text-gray-600 mt-2">Manage all drivers in the system</p>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filter by Status:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('registered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'registered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Registered ({statusCounts.registered})
            </button>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending_approval'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              Pending ({statusCounts.pending_approval})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Active ({statusCounts.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Suspended ({statusCounts.inactive})
            </button>
          </div>
        </div>
      </div>

      {!filteredUsers || filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">
            {statusFilter === 'all' 
              ? 'No drivers registered yet'
              : `No drivers with status "${statusFilter}"`
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Drivers will appear here once users complete registration
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers?.map((user: any) => (
            <div key={user.id} className="card hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-gray-600">{user.mobile_number}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full text-white`}
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {user.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm border-t pt-3">
                  {user.driving_license_number && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>DL: {user.driving_license_number}</span>
                    </div>
                  )}
                  {user.aadhar_number && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🆔</span>
                      <span>Aadhar: XXXX-XXXX-{user.aadhar_number.slice(-4)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-gray-600">MPIN:</span>
                    <span className={user.has_mpin ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {user.has_mpin ? '✓ Set' : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Verified:</span>
                    <span className={user.is_verified ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                      {user.is_verified ? '✓ Yes' : '⏳ Pending'}
                    </span>
                  </div>
                </div>

                {/* Monthly Salary Section */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      Monthly Salary
                    </span>
                    {editingSalary !== user.id && (
                      <button
                        onClick={() => handleStartEditSalary(user.id, user.monthly_salary, user.working_days)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Salary & Working Days"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingSalary === user.id ? (
                    <div className="space-y-3 bg-green-50 p-3 rounded-lg">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Monthly Salary</label>
                        <input
                          type="number"
                          value={salaryValue}
                          onChange={(e) => setSalaryValue(e.target.value)}
                          placeholder="Enter salary"
                          min="0"
                          step="100"
                          className="input w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Working Days/Month</label>
                        <input
                          type="number"
                          value={workingDaysValue}
                          onChange={(e) => setWorkingDaysValue(e.target.value)}
                          placeholder="e.g., 26"
                          min="1"
                          max="31"
                          className="input w-full text-sm"
                        />
                      </div>
                      {salaryValue && workingDaysValue && parseFloat(salaryValue) > 0 && parseInt(workingDaysValue) > 0 && (
                        <div className="p-2 bg-blue-100 rounded text-xs text-blue-800">
                          Per day: <strong>₹{(parseFloat(salaryValue) / parseInt(workingDaysValue)).toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveSalary(user.id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          disabled={updateSalaryMutation.isPending}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold text-green-600 mb-1">
                        {user.monthly_salary 
                          ? `₹${user.monthly_salary.toLocaleString()}`
                          : <span className="text-gray-400 text-sm font-normal">Not set</span>
                        }
                      </div>
                      {user.working_days && user.monthly_salary && (
                        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Working Days:</span>
                          <span className="font-medium text-gray-700">{user.working_days} days</span>
                        </div>
                      )}
                      {user.working_days && user.monthly_salary && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-600">Per Day:</span>
                          <span className="font-semibold text-blue-600">
                            ₹{(user.monthly_salary / user.working_days).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {user.email && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    📧 {user.email}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getStatusColor(statusCode: string) {
  const colors: Record<string, string> = {
    'registered': '#3B82F6',
    'pending_approval': '#F59E0B',
    'active': '#10B981',
    'inactive': '#EF4444',
    'deactivated': '#6B7280',
  }
  return colors[statusCode] || '#6B7280'
}


