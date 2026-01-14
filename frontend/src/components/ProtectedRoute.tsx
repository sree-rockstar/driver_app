import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()

  console.log('ProtectedRoute check:', { 
    hasToken: !!token, 
    hasUser: !!user, 
    userRole: user?.role,
    requireAdmin 
  })

  if (!token || !user) {
    console.log('No token or user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    console.log('Admin required but user is not admin, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('Access granted')
  return <>{children}</>
}


