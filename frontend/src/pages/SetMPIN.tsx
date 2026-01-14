import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mpinAPI, authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function SetMPIN() {
  const [mpin, setMpin] = useState('')
  const [confirmMpin, setConfirmMpin] = useState('')
  const [showMpin, setShowMpin] = useState(false)
  const [showConfirmMpin, setShowConfirmMpin] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth, user } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mpin.length !== 4 && mpin.length !== 6) {
      addToast('MPIN must be 4 or 6 digits', 'error')
      return
    }

    if (!/^\d+$/.test(mpin)) {
      addToast('MPIN must contain only numbers', 'error')
      return
    }

    if (mpin !== confirmMpin) {
      addToast('MPIN and Confirm MPIN do not match', 'error')
      return
    }

    setLoading(true)

    try {
      await mpinAPI.setMPIN({ mpin, confirm_mpin: confirmMpin })
      
      // Refresh user data
      const { data: userData } = await authAPI.getCurrentUser()
      if (user?.token) {
        setAuth(userData, user.token)
      }
      
      addToast('MPIN set successfully! Your account is pending admin approval.', 'success')
      
      navigate('/dashboard')
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Failed to set MPIN. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/PRT_logo.png" 
              alt="PR TRAVELS Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Set MPIN</h2>
          <p className="text-gray-600 mt-2">Create a secure MPIN for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="mpin" className="block text-sm font-medium text-gray-700 mb-2">
              MPIN (4 or 6 digits)
            </label>
            <div className="relative">
              <input
                id="mpin"
                type={showMpin ? 'text' : 'password'}
                value={mpin}
                onChange={(e) => setMpin(e.target.value)}
                className="input pr-10"
                required
                placeholder="Enter MPIN"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowMpin(!showMpin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showMpin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmMpin" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm MPIN
            </label>
            <div className="relative">
              <input
                id="confirmMpin"
                type={showConfirmMpin ? 'text' : 'password'}
                value={confirmMpin}
                onChange={(e) => setConfirmMpin(e.target.value)}
                className="input pr-10"
                required
                placeholder="Re-enter MPIN"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowConfirmMpin(!showConfirmMpin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmMpin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After setting MPIN, your account will be sent for admin approval.
              You'll be able to use all features once approved.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting MPIN...' : 'Set MPIN'}
          </button>
        </form>
      </div>
    </div>
  )
}

