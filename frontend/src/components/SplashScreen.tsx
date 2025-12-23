import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2000)

    // Call onFinish after fade animation completes
    const finishTimer = setTimeout(() => {
      onFinish()
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <img
              src="/PRT_logo.png"
              alt="PR TRAVELS"
              className="h-32 w-auto object-contain"
            />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">PR TRAVELS</h1>
        <p className="text-xl text-primary-100">Driver App</p>
        <div className="mt-8">
          <div className="inline-block">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


