import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { UserPlus, Upload, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

export default function Register() {
  const [formData, setFormData] = useState({
    mobile_number: '',
    full_name: '',
    email: '',
    driving_license_number: '',
    aadhar_number: '',
  })
  
  const [files, setFiles] = useState({
    dl_front: null as File | null,
    dl_back: null as File | null,
    aadhar_front: null as File | null,
    aadhar_back: null as File | null,
  })
  
  const [filePreviews, setFilePreviews] = useState({
    dl_front: '',
    dl_back: '',
    aadhar_front: '',
    aadhar_back: '',
  })
  
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast(t('register.fileSizeError'), 'error')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast(t('register.fileTypeError'), 'error')
        return
      }
      
      setFiles({ ...files, [field]: file })
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreviews({ ...filePreviews, [field]: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.mobile_number.length !== 10 || !/^\d+$/.test(formData.mobile_number)) {
      addToast(t('register.invalidMobile'), 'error')
      return
    }

    // Validate required documents
    if (!files.dl_front) {
      addToast(t('register.uploadDlFront'), 'error')
      return
    }
    if (!files.dl_back) {
      addToast(t('register.uploadDlBack'), 'error')
      return
    }
    if (!files.aadhar_front) {
      addToast(t('register.uploadAadharFront'), 'error')
      return
    }
    if (!files.aadhar_back) {
      addToast(t('register.uploadAadharBack'), 'error')
      return
    }

    setLoading(true)

    try {
      const { data } = await authAPI.register({
        mobile_number: formData.mobile_number,
        full_name: formData.full_name,
        email: formData.email || undefined,
        driving_license_number: formData.driving_license_number || undefined,
        aadhar_number: formData.aadhar_number || undefined,
        dl_front: files.dl_front || undefined,
        dl_back: files.dl_back || undefined,
        aadhar_front: files.aadhar_front || undefined,
        aadhar_back: files.aadhar_back || undefined,
      })
      
      // Auto-login the user with the returned token
      setAuth(data.user, data.access_token)
      
      addToast(t('register.registrationSuccess'), 'success')
      
      // Redirect to set MPIN
      navigate('/set-mpin')
    } catch (err: any) {
      addToast(err.response?.data?.detail || t('register.registrationFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const FileUploadButton = ({ 
    label, 
    field, 
    required = false 
  }: { 
    label: string
    field: keyof typeof files
    required?: boolean
  }  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, field)}
          className="hidden"
          id={field}
        />
        <label
          htmlFor={field}
          className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            filePreviews[field] 
              ? 'border-green-500 hover:border-green-600' 
              : 'border-gray-300 hover:border-primary-500'
          }`}
        >
          {filePreviews[field] ? (
            <div className="flex flex-col items-center">
              <img 
                src={filePreviews[field]} 
                alt={label} 
                className="h-20 w-20 object-cover rounded mb-2"
              />
              <span className="text-sm text-green-600">✓ {t('register.uploaded')}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm">{t('register.uploadClick')}</span>
            </div>
          )}
        </label>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
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
          <h2 className="text-3xl font-bold text-gray-900">{t('register.title')}</h2>
          <p className="text-gray-600 mt-2">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('register.basicInfo')}</h3>
            
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('register.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.mobileNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                value={formData.mobile_number}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('auth.mobilePlaceholder')}
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.emailOptional')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder={t('register.emailPlaceholder')}
              />
            </div>
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('register.documentDetails')}</h3>
            
            <div>
              <label htmlFor="driving_license_number" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.dlNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                id="driving_license_number"
                name="driving_license_number"
                type="text"
                value={formData.driving_license_number}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('register.dlNumberPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.aadharNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                id="aadhar_number"
                name="aadhar_number"
                type="text"
                value={formData.aadhar_number}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('register.aadharNumberPlaceholder')}
                pattern="[0-9]{12}"
                maxLength={12}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('register.uploadDocuments')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadButton label={t('register.dlFront')} field="dl_front" required />
              <FileUploadButton label={t('register.dlBack')} field="dl_back" required />
              <FileUploadButton label={t('register.aadharFront')} field="aadhar_front" required />
              <FileUploadButton label={t('register.aadharBack')} field="aadhar_back" required />
            </div>
            
            <p className="text-xs text-gray-500">
              * {t('register.allDocsRequired')}. {t('register.maxFileSize')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('register.creatingAccount') : t('register.registerAsDriver')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
