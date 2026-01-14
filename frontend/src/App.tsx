import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import SetMPIN from './pages/SetMPIN'
import UserDashboard from './pages/user/Dashboard'
import Profile from './pages/user/Profile'
import MicrosoftTrips from './pages/user/MicrosoftTrips'
import TripsList from './pages/user/TripsList'
import TripSheetView from './pages/user/TripSheetView'
import AddEditTrip from './pages/user/AddEditTrip'
import MyEarnings from './pages/user/MyEarnings'
import RequestMoney from './pages/user/RequestMoney'
import MyVehicle from './pages/user/MyVehicle'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDrivers from './pages/admin/Drivers'
import AdminStatuses from './pages/admin/Statuses'
import AdminTrips from './pages/admin/Trips'
import AdminFleet from './pages/admin/Fleet'
import AdminMoneyRequests from './pages/admin/MoneyRequests'
import TripConfig from './pages/admin/TripConfig'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import ToastContainer from './components/Toast'

function App() {
  const { user } = useAuthStore()
  const [showSplash, setShowSplash] = useState(true)

  // Check if splash has been shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown')
    if (splashShown === 'true') {
      setShowSplash(false)
    }
  }, [])

  const handleSplashFinish = () => {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* MPIN Route */}
        <Route
          path="/set-mpin"
          element={
            <ProtectedRoute>
              <SetMPIN />
            </ProtectedRoute>
          }
        />
        
        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <UserDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <UserDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/microsoft-trips"
          element={
            <ProtectedRoute>
              <Layout>
                <MicrosoftTrips />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/trips"
          element={
            <ProtectedRoute>
              <Layout>
                <TripsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/trip-sheet"
          element={
            <ProtectedRoute>
              <Layout>
                <TripSheetView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/add-trip"
          element={
            <ProtectedRoute>
              <Layout>
                <AddEditTrip />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-earnings"
          element={
            <ProtectedRoute>
              <Layout>
                <MyEarnings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/request-money"
          element={
            <ProtectedRoute>
              <Layout>
                <RequestMoney />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-vehicle"
          element={
            <ProtectedRoute>
              <Layout>
                <MyVehicle />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminDrivers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/statuses"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminStatuses />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminTrips />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fleet"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminFleet />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/money-requests"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <AdminMoneyRequests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trip-config"
          element={
            <ProtectedRoute requireAdmin>
              <Layout isAdmin>
                <TripConfig />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Default redirect */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App


