"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react'
import { getSupabase } from '@/lib/supabase-client'
import { toast } from 'sonner'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkResetSession()
  }, [])

  const checkResetSession = async () => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Authentication service not configured')
        setCheckingSession(false)
        return
      }

      // Check if user has a valid session for password reset
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw new Error(error.message)
      }

      if (data.session?.user) {
        setIsValidSession(true)
        toast.info('You can now set a new password')
      } else {
        // Check URL parameters for reset tokens
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            throw new Error(sessionError.message)
          }

          if (sessionData.session?.user) {
            setIsValidSession(true)
            toast.info('You can now set a new password')
          } else {
            throw new Error('Invalid reset session')
          }
        } else {
          throw new Error('No valid password reset session found')
        }
      }
    } catch (err) {
      console.error('Reset session check error:', err)
      setError(err instanceof Error ? err.message : 'Invalid password reset link')
    } finally {
      setCheckingSession(false)
    }
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return errors
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error('Authentication service not configured')
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)
      toast.success('Password updated successfully!')

      // Redirect to login after success
      setTimeout(() => {
        router.push('/login?message=password-updated')
      }, 3000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update password')
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password)
    const strength = 4 - errors.length
    
    if (strength === 4) return { level: 'Strong', color: 'text-green-600' }
    if (strength === 3) return { level: 'Good', color: 'text-blue-600' }
    if (strength === 2) return { level: 'Fair', color: 'text-yellow-600' }
    return { level: 'Weak', color: 'text-red-600' }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-center text-muted-foreground">
              Verifying your password reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Please request a new password reset link.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push('/login')}>
                Back to Login
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can now sign in with your new password.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {password && (
                <p className={`text-sm ${passwordStrength.color}`}>
                  Strength: {passwordStrength.level}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Password requirements:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  • One number
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>

            <div className="text-center">
              <Button 
                type="button"
                variant="link" 
                onClick={() => router.push('/login')}
                disabled={loading}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  )
}
