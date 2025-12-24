import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statusAPI, adminAPI } from '../../lib/api'
import { Tag, TrendingUp, ChevronDown, ChevronUp, Users as UsersIcon, Mail, Phone, Check, X, UserCheck, UserX, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useToastStore } from '../../store/toastStore'

export default function AdminStatuses() {
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const { data: statuses, isLoading: statusesLoading, error: statusesError } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const { data } = await statusAPI.getAllStatuses()
      return data
    },
  })

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['status-stats'],
    queryFn: async () => {
      const { data } = await statusAPI.getStats()
      return data.stats
    },
  })

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await adminAPI.getAllUsers()
      return data
    },
  })

  // Mutation for changing user status - MUST BE BEFORE EARLY RETURNS
  const changeStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      await adminAPI.changeUserStatus(userId, newStatus)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['status-stats'] })
      addToast('User status updated successfully', 'success')
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Failed to update user status', 'error')
    },
  })

  // NOW we can do early returns AFTER all hooks are called
  if (statusesLoading || statsLoading || usersLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (statusesError || statsError || usersError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading data. Please refresh the page.</p>
        <p className="text-sm text-gray-500 mt-2">
          {(statusesError as any)?.message || (statsError as any)?.message || (usersError as any)?.message}
        </p>
      </div>
    )
  }

  // Group users by status
  const usersByStatus = users?.reduce((acc: any, user: any) => {
    if (!acc[user.status]) {
      acc[user.status] = []
    }
    acc[user.status].push(user)
    return acc
  }, {}) || {}

  const toggleStatus = (statusCode: string) => {
    setExpandedStatus(expandedStatus === statusCode ? null : statusCode)
  }

  // Get available actions for a user based on their current status
  const getStatusActions = (currentStatus: string, allStatuses: any[]) => {
    const actions: Array<{
      label: string
      targetStatus: string
      icon: any
      color: string
      bgColor: string
    }> = []

    switch (currentStatus) {
      case 'pending_approval':
      case 'registered':
        actions.push(
          { 
            label: 'Approve', 
            targetStatus: 'active', 
            icon: Check, 
            color: 'text-green-700',
            bgColor: 'bg-green-100 hover:bg-green-200'
          },
          { 
            label: 'Reject', 
            targetStatus: 'rejected', 
            icon: X, 
            color: 'text-red-700',
            bgColor: 'bg-red-100 hover:bg-red-200'
          }
        )
        break
      
      case 'active':
        actions.push(
          { 
            label: 'Deactivate', 
            targetStatus: 'inactive', 
            icon: UserX, 
            color: 'text-orange-700',
            bgColor: 'bg-orange-100 hover:bg-orange-200'
          }
        )
        break
      
      case 'inactive':
        actions.push(
          { 
            label: 'Activate', 
            targetStatus: 'active', 
            icon: UserCheck, 
            color: 'text-green-700',
            bgColor: 'bg-green-100 hover:bg-green-200'
          }
        )
        break
      
      case 'suspended':
        actions.push(
          { 
            label: 'Reactivate', 
            targetStatus: 'active', 
            icon: Check, 
            color: 'text-green-700',
            bgColor: 'bg-green-100 hover:bg-green-200'
          }
        )
        break
      
      case 'rejected':
        actions.push(
          { 
            label: 'Reconsider', 
            targetStatus: 'pending_approval', 
            icon: AlertCircle, 
            color: 'text-blue-700',
            bgColor: 'bg-blue-100 hover:bg-blue-200'
          }
        )
        break
    }

    return actions
  }

  const handleStatusChange = (userId: string, userName: string, currentStatus: string, newStatus: string, actionLabel: string) => {
    const confirmMessage = `Are you sure you want to ${actionLabel.toLowerCase()} ${userName}?`
    if (window.confirm(confirmMessage)) {
      changeStatusMutation.mutate({ userId, newStatus })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Status Management</h1>
        <p className="text-gray-600 mt-2">Manage user statuses and view statistics</p>
      </div>

      {/* Statistics */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2" />
          User Distribution by Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.map((stat: any) => (
            <div 
              key={stat.status_code}
              className="p-4 rounded-lg border-2"
              style={{ borderColor: stat.color }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.status_name}</p>
                  <p className="text-3xl font-bold" style={{ color: stat.color }}>
                    {stat.count}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Tag className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status List with Users */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <UsersIcon className="w-6 h-6 mr-2" />
          Users by Status
        </h2>
        <div className="space-y-3">
          {statuses?.map((status: any) => {
            const statusUsers = usersByStatus?.[status.code] || []
            const isExpanded = expandedStatus === status.code
            
            return (
              <div
                key={status.id}
                className="rounded-lg border-2"
                style={{ borderColor: status.color }}
              >
                {/* Status Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleStatus(status.code)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{status.name}</h3>
                      <p className="text-sm text-gray-600">{status.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Code: {status.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ 
                          backgroundColor: `${status.color}20`,
                          color: status.color 
                        }}
                      >
                        {statusUsers.length} {statusUsers.length === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                    {statusUsers.length > 0 && (
                      isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )
                    )}
                  </div>
                </div>

                {/* User List */}
                {isExpanded && statusUsers.length > 0 && (
                  <div className="border-t" style={{ borderColor: status.color }}>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-2">
                        {statusUsers.map((user: any) => {
                          const actions = getStatusActions(user.status, statuses)
                          
                          return (
                            <div
                              key={user.id}
                              className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                      {user.role}
                                    </span>
                                    {user.has_mpin ? (
                                      <span className="text-xs text-green-600 font-semibold">✓ MPIN</span>
                                    ) : (
                                      <span className="text-xs text-gray-400">No MPIN</span>
                                    )}
                                  </div>
                                  <div className="mt-1 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{user.mobile_number}</span>
                                    </div>
                                    {user.email && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                {actions.length > 0 && (
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {actions.map((action) => {
                                      const Icon = action.icon
                                      return (
                                        <button
                                          key={action.targetStatus}
                                          onClick={() => handleStatusChange(
                                            user.id,
                                            user.full_name,
                                            user.status,
                                            action.targetStatus,
                                            action.label
                                          )}
                                          disabled={changeStatusMutation.isPending}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${action.bgColor} ${action.color} disabled:opacity-50`}
                                          title={`${action.label} ${user.full_name}`}
                                        >
                                          <Icon className="w-3.5 h-3.5" />
                                          <span>{action.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {isExpanded && statusUsers.length === 0 && (
                  <div className="border-t p-4 text-center text-gray-500 text-sm" style={{ borderColor: status.color }}>
                    No users with this status
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card bg-blue-50 border-l-4 border-blue-600">
        <p className="text-blue-800">
          <strong>Note:</strong> Statuses are configurable in the database. Contact your system administrator to add or modify statuses.
        </p>
      </div>
    </div>
  )
}

