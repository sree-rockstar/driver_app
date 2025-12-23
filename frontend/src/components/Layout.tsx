import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, Menu, X, Home, Users, Car, CheckCircle, Clock, User, MapPin, Truck, Gauge, Settings, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'

interface LayoutProps {
  children: React.ReactNode
  isAdmin?: boolean
}

export default function Layout({ children, isAdmin = false }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const navItems = isAdmin
    ? [
        { name: t('admin.dashboard'), href: '/admin', icon: Home },
        { name: t('admin.users'), href: '/admin/users', icon: Users },
        { name: t('admin.drivers'), href: '/admin/drivers', icon: Car },
        { name: 'Fleet', href: '/admin/fleet', icon: Truck },
        { name: t('admin.trips'), href: '/admin/trips', icon: MapPin },
        { name: 'Money Requests', href: '/admin/money-requests', icon: Wallet },
        { name: 'Trip Config', href: '/admin/trip-config', icon: Settings },
      ]
    : [
        { name: t('dashboard.title'), href: '/dashboard', icon: Home },
        { name: 'My Vehicle', href: '/user/my-vehicle', icon: Car },
      ]

  // Get status chip configuration
  const getStatusChip = () => {
    if (!user) return null
    
    if (user.status === 'active') {
      return {
        label: t('dashboard.accountActive'),
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        iconColor: 'text-green-600'
      }
    } else if (user.status === 'pending_approval') {
      return {
        label: t('dashboard.pendingApproval'),
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600'
      }
    } else if (user.is_verified) {
      return {
        label: t('dashboard.verified'),
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: CheckCircle,
        iconColor: 'text-blue-600'
      }
    }
    return null
  }

  const statusChip = getStatusChip()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-3 px-4 sm:px-6 lg:px-8">
            {/* Left: Logo and Brand */}
            <div className="flex items-center space-x-2 -ml-2">
            <img 
              src="/PRT_logo.png" 
              alt="PR TRAVELS" 
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-primary-600 leading-tight">
                PR TRAVELS
              </h1>
            </div>
          </div>

            {/* Center: Navigation and Status */}
            <div className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center text-sm text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <item.icon className="w-4 h-4 mr-1.5" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Status Chip */}
              {statusChip && (
                <div className={`hidden lg:flex items-center px-2.5 py-1 rounded-full border ${statusChip.bgColor} ${statusChip.textColor} ${statusChip.borderColor}`}>
                  <statusChip.icon className={`w-3.5 h-3.5 mr-1 ${statusChip.iconColor}`} />
                  <span className="text-xs font-medium whitespace-nowrap">{statusChip.label}</span>
                </div>
              )}
            </div>

            {/* Right: Language, Avatar, Mobile Menu */}
            <div className="flex items-center space-x-3">
              {/* Language Selector - Hidden on small screens */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>
              
              {/* Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                    {getInitials(user?.full_name)}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(user?.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                            <p className="text-xs text-gray-500">{user?.mobile_number}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Chip in Dropdown - Visible on smaller screens */}
                      {statusChip && (
                        <div className="px-4 py-2 lg:hidden">
                          <div className={`flex items-center px-2.5 py-1.5 rounded-full border ${statusChip.bgColor} ${statusChip.textColor} ${statusChip.borderColor}`}>
                            <statusChip.icon className={`w-4 h-4 mr-1.5 ${statusChip.iconColor}`} />
                            <span className="text-xs font-medium">{statusChip.label}</span>
                          </div>
                        </div>
                      )}

                      {/* Language Selector - Mobile */}
                      <div className="px-4 py-2 md:hidden border-b border-gray-100">
                        <LanguageSelector />
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          {t('dashboard.profile')}
                        </Link>
                        
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false)
                            handleLogout()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {t('auth.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t px-4 sm:px-6 lg:px-8">
              {/* User Info */}
              <div className="px-3 py-2 mb-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 mt-1">{user?.mobile_number}</p>
              </div>

              {/* Status Chip for Mobile */}
              {statusChip && (
                <div className={`flex items-center px-3 py-2 mb-3 rounded-lg border ${statusChip.bgColor} ${statusChip.textColor} ${statusChip.borderColor}`}>
                  <statusChip.icon className={`w-5 h-5 mr-2 ${statusChip.iconColor}`} />
                  <span className="text-sm font-medium">{statusChip.label}</span>
                </div>
              )}
              
              {/* Navigation Links */}
              <nav>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </Link>
                ))}
                
                {/* Profile Link for Non-Admin */}
                {!isAdmin && (
                  <Link
                    to="/profile"
                    className="flex items-center py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5 mr-2" />
                    {t('dashboard.profile')}
                  </Link>
                )}
                
                {/* Logout Link */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center py-2 w-full text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  {t('auth.logout')}
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}


