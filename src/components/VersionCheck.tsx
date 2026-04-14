import { useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

const CHECK_INTERVAL = 1000 * 60 * 5 // 5 minutes

export function VersionCheck() {
  const { toast } = useToast()
  const lastCheckedVersion = useRef<string>(__APP_VERSION__)
  const isToastActive = useRef(false)

  const checkForUpdate = useCallback(async () => {
    try {
      // Add cache-busting timestamp
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
      })
      
      if (!response.ok) return

      const data = await response.json()
      const latestVersion = data.version

      if (latestVersion && latestVersion !== __APP_VERSION__ && latestVersion !== lastCheckedVersion.current) {
        if (isToastActive.current) return

        lastCheckedVersion.current = latestVersion
        isToastActive.current = true

        toast({
          title: 'Update Available',
          description: `A new version (${latestVersion}) is available. Please reload to update.`,
          action: (
            <ToastAction 
              altText="Reload app to update" 
              onClick={() => window.location.reload()}
            >
              Reload
            </ToastAction>
          ),
          duration: Number.POSITIVE_INFINITY,
          onOpenChange: (open) => {
            if (!open) isToastActive.current = false
          }
        })
      }
    } catch (error) {
      // Silently ignore errors as this is a background task
      console.debug('[VersionCheck] Update check failed', error)
    }
  }, [toast])

  useEffect(() => {
    // Initial check
    checkForUpdate()

    // Periodical check
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL)

    // Check on foregrounding
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkForUpdate])

  return null
}
