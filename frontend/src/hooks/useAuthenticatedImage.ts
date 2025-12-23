import { useState, useEffect } from 'react'
import { getAuthenticatedImageUrl } from '../lib/api'

/**
 * Hook to load images that require authentication
 * Fetches the image with auth token and returns a blob URL
 * 
 * @param apiPath - API path to the image (e.g., "/documents/file/123abc")
 * @returns Object with loading state, error, and imageUrl (blob URL)
 * 
 * Usage:
 * const { imageUrl, loading, error } = useAuthenticatedImage(user.documents.driving_license_front)
 * return <img src={imageUrl || placeholderImage} alt="Document" />
 */
export const useAuthenticatedImage = (apiPath: string | null | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!apiPath) {
      setImageUrl(null)
      setLoading(false)
      return
    }

    let isMounted = true
    let blobUrl: string | null = null

    const loadImage = async () => {
      setLoading(true)
      setError(null)

      try {
        blobUrl = await getAuthenticatedImageUrl(apiPath)
        if (isMounted) {
          setImageUrl(blobUrl)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load image'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadImage()

    // Cleanup: Revoke blob URL when component unmounts or apiPath changes
    return () => {
      isMounted = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [apiPath])

  return { imageUrl, loading, error }
}

/**
 * Hook to load multiple authenticated images at once
 * 
 * @param apiPaths - Array of API paths
 * @returns Object with loading state, errors, and imageUrls (array of blob URLs)
 */
export const useAuthenticatedImages = (apiPaths: (string | null | undefined)[]) => {
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<(Error | null)[]>([])

  useEffect(() => {
    let isMounted = true
    const blobUrls: (string | null)[] = []

    const loadImages = async () => {
      setLoading(true)
      setErrors([])

      const results = await Promise.allSettled(
        apiPaths.map(path => 
          path ? getAuthenticatedImageUrl(path) : Promise.resolve(null)
        )
      )

      if (isMounted) {
        const urls: (string | null)[] = []
        const errs: (Error | null)[] = []

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            urls.push(result.value)
            blobUrls.push(result.value)
            errs.push(null)
          } else {
            urls.push(null)
            errs.push(result.reason instanceof Error ? result.reason : new Error('Failed to load image'))
          }
        })

        setImageUrls(urls)
        setErrors(errs)
        setLoading(false)
      }
    }

    loadImages()

    // Cleanup
    return () => {
      isMounted = false
      blobUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [JSON.stringify(apiPaths)])

  return { imageUrls, loading, errors }
}

