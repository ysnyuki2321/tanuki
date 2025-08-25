import React from 'react'
import { getConfig, getSetupStatus } from './config'
import { isSupabaseConfigured } from './supabase-client'

export interface ServiceStatus {
  name: string
  key: string
  configured: boolean
  required: boolean
  description: string
  setupUrl?: string
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  services: ServiceStatus[]
  criticalIssues: string[]
  warnings: string[]
  canOperate: boolean
}

export class ServiceChecker {
  // Check if core services are available
  static checkCoreServices(): ServiceStatus[] {
    const config = getConfig()
    
    return [
      {
        name: 'Database',
        key: 'database',
        configured: isSupabaseConfigured(),
        required: true,
        description: 'Supabase database for user data and file metadata',
        setupUrl: '/admin?tab=database'
      },
      {
        name: 'File Storage',
        key: 'storage',
        configured: isSupabaseConfigured(), // Supabase provides storage too
        required: true,
        description: 'File storage backend for uploaded files',
        setupUrl: '/admin?tab=storage'
      },
      {
        name: 'Email Service',
        key: 'email',
        configured: !!(config.smtp_host && config.smtp_user),
        required: false,
        description: 'SMTP service for email verification and notifications',
        setupUrl: '/admin?tab=email'
      },
      {
        name: 'Authentication',
        key: 'auth',
        configured: isSupabaseConfigured(),
        required: true,
        description: 'User authentication and session management',
        setupUrl: '/admin?tab=auth'
      }
    ]
  }

  // Check optional/integration services
  static checkIntegrationServices(): ServiceStatus[] {
    const config = getConfig()
    
    return [
      {
        name: 'Payment Processing',
        key: 'payments',
        configured: !!(config.stripe_public_key || config.paypal_client_id),
        required: false,
        description: 'Payment gateway for subscriptions',
        setupUrl: '/admin?tab=payments'
      },
      {
        name: 'OAuth Providers',
        key: 'oauth',
        configured: !!(config.google_client_id || config.github_client_id),
        required: false,
        description: 'Social login providers',
        setupUrl: '/admin?tab=oauth'
      },
      {
        name: 'Monitoring',
        key: 'monitoring',
        configured: !!config.sentry_dsn,
        required: false,
        description: 'Error tracking and monitoring',
        setupUrl: '/admin?tab=monitoring'
      },
      {
        name: 'CDN',
        key: 'cdn',
        configured: !!config.cdn_url,
        required: false,
        description: 'Content delivery network for faster file access',
        setupUrl: '/admin?tab=performance'
      }
    ]
  }

  // Get overall system health
  static getSystemHealth(): SystemHealth {
    const coreServices = this.checkCoreServices()
    const integrationServices = this.checkIntegrationServices()
    const allServices = [...coreServices, ...integrationServices]

    const criticalIssues: string[] = []
    const warnings: string[] = []

    // Check critical services
    const failedCritical = coreServices.filter(s => s.required && !s.configured)
    failedCritical.forEach(service => {
      criticalIssues.push(`${service.name} is not configured`)
    })

    // Check important but non-critical services
    const failedOptional = allServices.filter(s => !s.required && !s.configured)
    failedOptional.forEach(service => {
      warnings.push(`${service.name} is not configured (optional)`)
    })

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical'
    if (criticalIssues.length > 0) {
      overall = 'critical'
    } else if (warnings.length > 2) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    // Can operate if no critical issues
    const canOperate = criticalIssues.length === 0

    return {
      overall,
      services: allServices,
      criticalIssues,
      warnings,
      canOperate
    }
  }

  // Check if specific service is available
  static isServiceAvailable(serviceKey: string): boolean {
    const allServices = [
      ...this.checkCoreServices(),
      ...this.checkIntegrationServices()
    ]
    
    const service = allServices.find(s => s.key === serviceKey)
    return service?.configured || false
  }

  // Get setup recommendations
  static getSetupRecommendations(): {
    critical: { service: string; action: string; url: string }[]
    recommended: { service: string; action: string; url: string }[]
  } {
    const health = this.getSystemHealth()
    
    const critical = health.services
      .filter(s => s.required && !s.configured)
      .map(s => ({
        service: s.name,
        action: `Configure ${s.name}`,
        url: s.setupUrl || '/admin'
      }))

    const recommended = health.services
      .filter(s => !s.required && !s.configured)
      .slice(0, 3) // Top 3 recommendations
      .map(s => ({
        service: s.name,
        action: `Setup ${s.name}`,
        url: s.setupUrl || '/admin'
      }))

    return { critical, recommended }
  }

  // Check if app can function with current configuration
  static canAppFunction(): boolean {
    return this.getSystemHealth().canOperate
  }

  // Get user-friendly status message
  static getStatusMessage(): string {
    const health = this.getSystemHealth()
    
    switch (health.overall) {
      case 'healthy':
        return 'All systems operational'
      case 'degraded':
        return 'Some optional features may not be available'
      case 'critical':
        return 'Critical services need configuration before the app can function'
      default:
        return 'Unknown system status'
    }
  }

  // Test service connections
  static async testConnections(): Promise<{
    database: boolean
    storage: boolean
    email: boolean
    [key: string]: boolean
  }> {
    const results = {
      database: false,
      storage: false,
      email: false
    }

    try {
      // Test database connection
      if (isSupabaseConfigured()) {
        const { getSupabase } = await import('./supabase-client')
        const supabase = getSupabase()
        if (supabase) {
          const { error } = await (supabase as any).from('users').select('count').limit(1)
          results.database = !error
        }
      }

      // Test storage (same as database for Supabase)
      results.storage = results.database

      // Test email (would need to actually send a test email)
      const config = getConfig()
      results.email = !!(config.smtp_host && config.smtp_user)

    } catch (error) {
      console.error('Connection test error:', error)
    }

    return results
  }

  // Get setup progress percentage
  static getSetupProgress(): number {
    const health = this.getSystemHealth()
    const totalServices = health.services.length
    const configuredServices = health.services.filter(s => s.configured).length
    
    return Math.round((configuredServices / totalServices) * 100)
  }
}

// Utility function to check if feature can be used
export function canUseFeature(feature: string): boolean {
  switch (feature) {
    case 'file_upload':
      return ServiceChecker.isServiceAvailable('storage')
    case 'user_auth':
      return ServiceChecker.isServiceAvailable('auth')
    case 'email_verification':
      return ServiceChecker.isServiceAvailable('email')
    case 'payments':
      return ServiceChecker.isServiceAvailable('payments')
    default:
      return true // Default to true for unknown features
  }
}

// Component hook for service status
export function useServiceStatus() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkServices = async () => {
      try {
        const systemHealth = ServiceChecker.getSystemHealth()
        setHealth(systemHealth)
      } catch (error) {
        console.error('Service check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkServices()
  }, [])

  return {
    health,
    loading,
    canOperate: health?.canOperate || false,
    statusMessage: ServiceChecker.getStatusMessage()
  }
}

export default ServiceChecker
