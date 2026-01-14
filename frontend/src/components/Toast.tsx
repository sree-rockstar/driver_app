import { useEffect } from 'react'
import { useToastStore, Toast as ToastType } from '../store/toastStore'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastIcon = ({ type }: { type: ToastType['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />
    case 'info':
      return <Info className="w-5 h-5 text-blue-600" />
  }
}

const ToastItem = ({ toast }: { toast: ToastType }) => {
  const { removeToast } = useToastStore()

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }

  return (
    <div
      className={`flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg border shadow-lg ${bgColors[toast.type]} animate-slide-in-right`}
    >
      <ToastIcon type={toast.type} />
      <p className={`flex-1 text-sm font-medium ${textColors[toast.type]}`}>
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className={`${textColors[toast.type]} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}


