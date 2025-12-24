import { useState, useEffect } from 'react'
import { X, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { adminAPI, getAuthenticatedImageUrl } from '../lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '../store/toastStore'

interface DocumentViewerModalProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function DocumentViewerModal({ userId, userName, onClose }: DocumentViewerModalProps) {
  const [documents, setDocuments] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [verificationNotes, setVerificationNotes] = useState('')
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()

  useEffect(() => {
    loadDocuments()
  }, [userId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data } = await adminAPI.getUserDocuments(userId)
      setDocuments(data)
      
      // Load image URLs for all documents
      const urls: Record<string, string> = {}
      for (const [key, doc] of Object.entries(data.documents || {})) {
        if ((doc as any).file_id) {
          try {
            const url = await getAuthenticatedImageUrl(`/documents/file/${(doc as any).file_id}`)
            urls[key] = url
          } catch (error) {
            console.error(`Failed to load ${key}:`, error)
          }
        }
      }
      setImageUrls(urls)
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const verifyMutation = useMutation({
    mutationFn: async (isVerified: boolean) => {
      await adminAPI.verifyDriver(userId, isVerified, verificationNotes || undefined)
    },
    onSuccess: (_, isVerified) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addToast(`Driver ${isVerified ? 'verified' : 'rejected'} successfully`, 'success')
      onClose()
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Failed to update verification', 'error')
    },
  })

  const handleVerify = (isVerified: boolean) => {
    if (!isVerified && !verificationNotes.trim()) {
      addToast('Please provide rejection notes', 'error')
      return
    }
    
    const action = isVerified ? 'verify' : 'reject'
    if (window.confirm(`Are you sure you want to ${action} ${userName}'s documents?`)) {
      verifyMutation.mutate(isVerified)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  const hasDocuments = documents?.documents && Object.keys(documents.documents).length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
            <p className="text-sm text-gray-600 mt-1">
              {userName} • {documents?.mobile_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Verification Status</p>
                <p className="text-lg font-semibold mt-1">
                  {documents?.is_verified ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Verified
                    </span>
                  ) : (
                    <span className="text-orange-600 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Pending Verification
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">DL: {documents?.driving_license_number || 'N/A'}</p>
                <p className="text-sm text-gray-600">Aadhar: {documents?.aadhar_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {hasDocuments ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driving License */}
                {(documents.documents.dl_front || documents.documents.dl_back) && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Driving License</h4>
                    
                    {documents.documents.dl_front && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          Front Side
                        </div>
                        {imageUrls.dl_front ? (
                          <img
                            src={imageUrls.dl_front}
                            alt="DL Front"
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {documents.documents.dl_back && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          Back Side
                        </div>
                        {imageUrls.dl_back ? (
                          <img
                            src={imageUrls.dl_back}
                            alt="DL Back"
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Aadhar Card */}
                {(documents.documents.aadhar_front || documents.documents.aadhar_back) && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Aadhar Card</h4>
                    
                    {documents.documents.aadhar_front && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          Front Side
                        </div>
                        {imageUrls.aadhar_front ? (
                          <img
                            src={imageUrls.aadhar_front}
                            alt="Aadhar Front"
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {documents.documents.aadhar_back && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          Back Side
                        </div>
                        {imageUrls.aadhar_back ? (
                          <img
                            src={imageUrls.aadhar_back}
                            alt="Aadhar Back"
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
            </div>
          )}

          {/* Verification Notes */}
          {hasDocuments && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes {!documents?.is_verified && <span className="text-red-500">(Required for rejection)</span>}
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add notes about document verification..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          {hasDocuments && !documents?.is_verified && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleVerify(true)}
                disabled={verifyMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
              >
                <CheckCircle className="w-5 h-5" />
                {verifyMutation.isPending ? 'Verifying...' : 'Verify & Approve'}
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={verifyMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
              >
                <XCircle className="w-5 h-5" />
                {verifyMutation.isPending ? 'Rejecting...' : 'Reject Documents'}
              </button>
            </div>
          )}

          {documents?.is_verified && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ This driver has been verified</p>
              {documents.verification_notes && (
                <p className="text-sm text-green-700 mt-2">
                  <strong>Notes:</strong> {documents.verification_notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

