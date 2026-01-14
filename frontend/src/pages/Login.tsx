import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { authAPI } from '../lib/api'
import { LogIn, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

export default function Login() {
  const [step, setStep] = useState<'mobile' | 'mpin'>('mobile')
  const [mobileNumber, setMobileNumber] = useState('')
  const [mpin, setMpin] = useState('')
  const [showMpin, setShowMpin] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleMobileNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await authAPI.checkMobile(mobileNumber)
      
      if (!data.has_mpin) {
        addToast(t('auth.mpinNotSet'), 'error')
        setLoading(false)
        return
      }
      
      setUserInfo(data)
      setStep('mpin')
    } catch (err: any) {
      addToast(err.response?.data?.detail || t('auth.mobileNotFound'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMpinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: tokenData } = await authAPI.login(mobileNumber, mpin)
      console.log('✅ Login successful, token received:', tokenData)
      
      // IMPORTANT: Set auth BEFORE calling getCurrentUser so the token is available
      setAuth({ 
        id: '', 
        mobile_number: mobileNumber, 
        full_name: userInfo?.full_name || '',
        role: 'driver',
        status: 'registered',
        is_verified: false,
        has_mpin: true
      } as any, tokenData.access_token)
      
      console.log('✅ Auth token set in store')
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: userData } = await authAPI.getCurrentUser()
      console.log('✅ User data received:', userData)
      
      // Update auth state with full user data
      setAuth(userData, tokenData.access_token)
      console.log('✅ Full auth state set, user role:', userData.role)
      
      // Navigate based on role
      if (userData.role === 'admin') {
        console.log('➡️  Navigating to /admin')
        navigate('/admin', { replace: true })
      } else {
        console.log('➡️  Navigating to /dashboard')
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      console.error('❌ Login error:', err)
      addToast(err.response?.data?.detail || t('auth.incorrectMpin'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('mobile')
    setMpin('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/PRT_logo.png" 
              alt={t('app.logoAlt')} 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t('auth.welcomeBack')}</h2>
          <p className="text-gray-600 mt-2">
            {step === 'mobile' ? t('auth.enterMobileNumber') : t('auth.enterMpin')}
          </p>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={handleMobileNext} className="space-y-6">
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.mobileNumber')}
              </label>
              <input
                id="mobileNumber"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="input text-lg"
                required
                placeholder={t('auth.mobilePlaceholder')}
                pattern="[0-9]{10}"
                maxLength={10}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length !== 10}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? t('auth.checkingMobile') : (
                <>
                  {t('common.next')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMpinSubmit} className="space-y-6">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">{t('auth.mobileNumber')}</p>
              <p className="text-lg font-semibold text-gray-900">{mobileNumber}</p>
              {userInfo?.full_name && (
                <p className="text-sm text-gray-600 mt-1">{t('auth.hello')}, {userInfo.full_name}!</p>
              )}
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-primary-600 hover:text-primary-700 mt-2"
              >
                {t('auth.changeMobileNumber')}
              </button>
            </div>

            <div>
              <label htmlFor="mpin" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.enterMpin')}
              </label>
              <div className="relative">
                <input
                  id="mpin"
                  type={showMpin ? 'text' : 'password'}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  className="input text-center text-2xl tracking-widest pr-10"
                  required
                  placeholder={t('auth.mpinPlaceholder')}
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus
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

            <button
              type="submit"
              disabled={loading || mpin.length < 4}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← {t('common.back')}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
