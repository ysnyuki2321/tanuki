"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { getSupabase } from '@/lib/supabase-client'
import { toast } from 'sonner'

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [type, setType] = useState<'email_verification' | 'password_reset' | 'oauth' | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Authentication service not configured')
        setLoading(false)
        return
      }

      // Get URL parameters
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const typeParam = searchParams.get('type')

      // Check for errors in URL
      if (errorParam) {
        setError(errorDescription || errorParam)
        setLoading(false)
        return
      }

      // Determine the type of callback
      if (typeParam === 'recovery') {
        setType('password_reset')
      } else if (typeParam === 'signup') {
        setType('email_verification')
      } else if (accessToken) {
        setType('oauth')
      } else {
        setType('email_verification') // Default
      }

      // Handle the session
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data.user) {
          setSuccess(true)
          toast.success('Authentication successful!')
          
          // Redirect based on type
          setTimeout(() => {
            if (type === 'password_reset') {
              router.push('/auth/reset-password')
            } else {
              router.push('/dashboard')
            }
          }, 2000)
        } else {
          throw new Error('Failed to authenticate user')
        }
      } else {
        // Handle session from URL hash (for some OAuth providers)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw new Error(error.message)
        }

        if (data.session) {
          setSuccess(true)
          toast.success('Authentication successful!')
          
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          // Try to handle URL hash manually
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const hashAccessToken = hashParams.get('access_token')
          const hashRefreshToken = hashParams.get('refresh_token')
          const hashError = hashParams.get('error')

          if (hashError) {
            throw new Error(hashParams.get('error_description') || hashError)
          }

          if (hashAccessToken && hashRefreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken
            })

            if (error) {
              throw new Error(error.message)
            }

            if (data.user) {
              setSuccess(true)
              toast.success('Authentication successful!')
              
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            }
          } else {
            throw new Error('No authentication tokens found')
          }
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
      toast.error('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (loading) return 'Processing Authentication...'
    if (error) return 'Authentication Failed'
    if (success) {
      switch (type) {
        case 'email_verification': return 'Email Verified Successfully!'
        case 'password_reset': return 'Ready to Reset Password'
        case 'oauth': return 'Sign In Successful!'
        default: return 'Authentication Successful!'
      }
    }
    return 'Authentication'
  }

  const getDescription = () => {
    if (loading) return 'Please wait while we verify your authentication...'
    if (error) return 'There was an issue with your authentication request.'
    if (success) {
      switch (type) {
        case 'email_verification': 
          return 'Your email has been verified. You can now access all features of your account.'
        case 'password_reset': 
          return 'You can now set a new password for your account.'
        case 'oauth': 
          return 'You have been successfully signed in via OAuth.'
        default: 
          return 'You have been successfully authenticated.'
      }
    }
    return ''
  }

  const getIcon = () => {
    if (loading) return <Loader2 className="w-16 h-16 animate-spin text-primary" />
    if (error) return <AlertCircle className="w-16 h-16 text-red-500" />
    if (success) return <CheckCircle className="w-16 h-16 text-green-500" />
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && type === 'email_verification' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your email has been successfully verified. You now have full access to your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">
                This may take a few moments...
              </div>
            ) : success ? (
              <>
                {type === 'password_reset' ? (
                  <Button 
                    onClick={() => router.push('/auth/reset-password')}
                    className="w-full"
                  >
                    Set New Password
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </>
            )}
          </div>

          {!loading && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <Button variant="link" className="p-0 h-auto text-sm">
                  Contact Support
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-center text-muted-foreground">
              Loading...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
