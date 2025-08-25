"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { AuthService } from '@/lib/auth-service'
import { getConfig, isFeatureEnabled } from '@/lib/enhanced-config'
import { toast } from 'sonner'

// GitHub and Google SVG icons
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

interface OAuthButtonsProps {
  onLoading?: (loading: boolean) => void
  disabled?: boolean
}

export function OAuthButtons({ onLoading, disabled }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)
  const [config, setConfig] = useState({
    googleEnabled: false,
    githubEnabled: false
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const currentConfig = getConfig()
      setConfig({
        googleEnabled: isFeatureEnabled('oauth_google_enabled', currentConfig) && 
                      !!(currentConfig.oauth_google_client_id && currentConfig.oauth_google_client_secret),
        githubEnabled: isFeatureEnabled('oauth_github_enabled', currentConfig) && 
                      !!(currentConfig.oauth_github_client_id && currentConfig.oauth_github_client_secret)
      })
    } catch (error) {
      console.error('Failed to load OAuth config:', error)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider)
    setError(null)
    onLoading?.(true)

    try {
      const result = await AuthService.signInWithOAuth(provider)
      
      if (result.url) {
        // Redirect to OAuth provider
        window.location.href = result.url
      } else {
        throw new Error('No OAuth URL returned')
      }
    } catch (err) {
      console.error(`${provider} OAuth error:`, err)
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`
      setError(errorMessage)
      toast.error(errorMessage)
      setLoading(null)
      onLoading?.(false)
    }
  }

  // If no OAuth providers are enabled, don't render anything
  if (!config.googleEnabled && !config.githubEnabled) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-2">
        {config.googleEnabled && (
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn('google')}
            disabled={disabled || loading !== null}
            className="w-full"
          >
            {loading === 'google' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
              </>
            )}
          </Button>
        )}

        {config.githubEnabled && (
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn('github')}
            disabled={disabled || loading !== null}
            className="w-full"
          >
            {loading === 'github' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to GitHub...
              </>
            ) : (
              <>
                <GitHubIcon className="mr-2 h-4 w-4" />
                Continue with GitHub
              </>
            )}
          </Button>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  )
}
