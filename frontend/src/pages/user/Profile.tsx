import { useAuthStore } from '../../store/authStore'
import { User, Phone, Mail, CreditCard, FileText, CheckCircle, XCircle, Eye, X, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useAuthenticatedImage } from '../../hooks/useAuthenticatedImage'

// Component to display authenticated image
const AuthenticatedImage = ({ 
  apiPath, 
  alt, 
  onPreview 
}: { 
  apiPath: string
  alt: string
  onPreview: (url: string, title: string) => void
}) => {
  const { imageUrl, loading } = useAuthenticatedImage(apiPath)
  
  return (
    <button
      onClick={() => imageUrl && onPreview(imageUrl, alt)}
      className="group relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
      disabled={!imageUrl}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500 bg-white rounded-full" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          Failed to load
        </div>
      )}
    </button>
  )
}

export default function Profile() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('')

  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
  }

  const closePreview = () => {
    setPreviewImage(null)
    setPreviewTitle('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.profile')}</h1>
        <p className="text-gray-600 mt-2">{t('profile.viewAndManage')}</p>
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('dashboard.profile')}</h3>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>
          </div>
        </div>

        {/* Mobile Card */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('dashboard.mobile')}</h3>
              <p className="text-sm text-gray-600">{user?.mobile_number}</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user?.is_verified ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {user?.is_verified ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('dashboard.status')}</h3>
              <p className="text-sm text-gray-600">
                {user?.is_verified ? t('dashboard.verified') : t('dashboard.pendingVerification')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <CreditCard className="w-6 h-6 mr-2" />
          {t('dashboard.documentInformation')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('dashboard.dlNumber')}</label>
            <p className="text-gray-900 mt-1">{user?.driving_license_number || t('dashboard.notProvided')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('dashboard.aadharNumber')}</label>
            <p className="text-gray-900 mt-1">
              {user?.aadhar_number ? `XXXX-XXXX-${user.aadhar_number.slice(-4)}` : t('dashboard.notProvided')}
            </p>
          </div>
          {user?.email && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('dashboard.email')}</label>
              <p className="text-gray-900 mt-1">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Upload Status */}
      {user?.documents && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            {t('dashboard.uploadedDocuments')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* DL Front */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.dlFront')}</p>
              {user.documents.driving_license_front ? (
                <AuthenticatedImage
                  apiPath={user.documents.driving_license_front}
                  alt={t('dashboard.dlFront')}
                  onPreview={handlePreview}
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>

            {/* DL Back */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.dlBack')}</p>
              {user.documents.driving_license_back ? (
                <AuthenticatedImage
                  apiPath={user.documents.driving_license_back}
                  alt={t('dashboard.dlBack')}
                  onPreview={handlePreview}
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>

            {/* Aadhar Front */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.aadharFront')}</p>
              {user.documents.aadhar_front ? (
                <AuthenticatedImage
                  apiPath={user.documents.aadhar_front}
                  alt={t('dashboard.aadharFront')}
                  onPreview={handlePreview}
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>

            {/* Aadhar Back */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.aadharBack')}</p>
              {user.documents.aadhar_back ? (
                <AuthenticatedImage
                  apiPath={user.documents.aadhar_back}
                  alt={t('dashboard.aadharBack')}
                  onPreview={handlePreview}
                />
              ) : (
                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white rounded-lg p-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 px-2">{previewTitle}</h3>
              <img
                src={previewImage}
                alt={previewTitle}
                className="w-full h-auto max-h-[75vh] object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

