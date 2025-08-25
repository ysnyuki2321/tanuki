"use client"

import React from 'react'
import { AlertCircle, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryState>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // In production, you could send this to your error tracking service
    // sendErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent {...this.state} />
      }

      return <DefaultErrorFallback {...this.state} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error }: ErrorBoundaryState) {
  const isConfigError = error?.message?.includes('not configured') || 
                       error?.message?.includes('Supabase') ||
                       error?.message?.includes('database')

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleSetup = () => {
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">
            {isConfigError ? 'Configuration Required' : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {isConfigError 
              ? 'The application needs to be configured before you can continue.'
              : 'An unexpected error occurred while loading the application.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConfigError ? (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Please set up the database connection and other required services.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {isConfigError ? (
              <Button onClick={handleSetup} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Open Setup
              </Button>
            ) : (
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            )}
            
            {!isConfigError && (
              <Button variant="outline" onClick={handleSetup} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Check Configuration
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer">
                Technical Details (Development)
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Configuration Error Component for specific config issues
export function ConfigurationError({ 
  title = "Configuration Required",
  message = "Please configure the required services to continue.",
  actionLabel = "Open Setup",
  onAction
}: {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      window.location.href = '/admin'
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-sm w-full text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-blue-900">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAction} className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for handling async errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    
    // You could integrate with error tracking service here
    // trackError(error, context)
    
    // For now, just throw to be caught by ErrorBoundary
    throw error
  }, [])

  return handleError
}

export default ErrorBoundary
