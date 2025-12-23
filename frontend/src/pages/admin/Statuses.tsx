import { useQuery } from '@tanstack/react-query'
import { statusAPI } from '../../lib/api'
import { Tag, TrendingUp } from 'lucide-react'

export default function AdminStatuses() {
  const { data: statuses, isLoading: statusesLoading } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const { data } = await statusAPI.getAllStatuses()
      return data
    },
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['status-stats'],
    queryFn: async () => {
      const { data } = await statusAPI.getStats()
      return data.stats
    },
  })

  if (statusesLoading || statsLoading) {
    return <div className="text-center py-8">Loading...</div>
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

      {/* Status List */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Available Statuses</h2>
        <div className="space-y-3">
          {statuses?.map((status: any) => (
            <div
              key={status.id}
              className="p-4 rounded-lg border-2 flex items-center justify-between"
              style={{ borderColor: status.color }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{status.name}</h3>
                  <p className="text-sm text-gray-600">{status.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Code: {status.code}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600">Order: {status.order}</span>
              </div>
            </div>
          ))}
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

