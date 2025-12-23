import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, statusAPI } from '../../lib/api'
import { Trash2, Edit, X, Plus, UserPlus, Info } from 'lucide-react'
import { useState } from 'react'

interface EditUserModalProps {
  user: any
  statuses: any[]
  onClose: () => void
  onSave: () => void
}

function EditUserModal({ user, statuses, onClose, onSave }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email || '',
    mobile_number: user.mobile_number,
    driving_license_number: user.driving_license_number || '',
    aadhar_number: user.aadhar_number || '',
  })
  const [selectedStatus, setSelectedStatus] = useState(user.status)
  const [error, setError] = useState('')

  const updateMutation = useMutation({
    mutationFn: async () => {
      await adminAPI.updateUser(user.id, formData)
      if (selectedStatus !== user.status) {
        await adminAPI.changeUserStatus(user.id, selectedStatus)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onSave()
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to update user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit User</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">User Information</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Full Name: User's complete name for identification</li>
                  <li>Mobile Number: Used for login (10 digits, cannot be changed)</li>
                  <li>Email: Optional email address for notifications</li>
                  <li>Driving License: Required for driver roles</li>
                  <li>Aadhar Number: Government ID (12 digits)</li>
                  <li>Status: Controls user's access to the system</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="input"
                required
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driving License Number
              </label>
              <input
                type="text"
                value={formData.driving_license_number}
                onChange={(e) => setFormData({ ...formData, driving_license_number: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                type="text"
                value={formData.aadhar_number}
                onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                className="input"
                maxLength={12}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
                required
              >
                {statuses?.map((status: any) => (
                  <option key={status.code} value={status.code}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<any>(null)

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await adminAPI.getAllUsers()
      return data
    },
  })

  const { data: statuses } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const { data } = await statusAPI.getAllStatuses()
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const getStatusColor = (statusCode: string) => {
    const status = statuses?.find((s: any) => s.code === statusCode)
    return status?.color || '#6B7280'
  }

  const getStatusName = (statusCode: string) => {
    const status = statuses?.find((s: any) => s.code === statusCode)
    return status?.name || statusCode
  }

  if (usersLoading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users in the system</p>
        </div>
        <button
          onClick={() => {/* Add user functionality - can be implemented later */
            alert('Add User feature: This would open a registration form for admins to create new users with initial credentials.')
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">User Management Guide</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Edit:</strong> Update user details and change status</li>
              <li>• <strong>Status:</strong> Control user access (Active, Pending Approval, Inactive, etc.)</li>
              <li>• <strong>Delete:</strong> Permanently remove user (use with caution)</li>
              <li>• <strong>MPIN:</strong> Mobile PIN for driver app login (4-6 digits)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MPIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.mobile_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                      style={{ backgroundColor: getStatusColor(user.status) }}
                    >
                      {getStatusName(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.has_mpin ? (
                      <span className="text-green-600 text-sm">✓ Set</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not Set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit User"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
                          deleteMutation.mutate(user.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && statuses && (
        <EditUserModal
          user={editingUser}
          statuses={statuses}
          onClose={() => setEditingUser(null)}
          onSave={() => {}}
        />
      )}
    </div>
  )
}
