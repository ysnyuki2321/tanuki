'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './auth-context'
import type { FeatureFlagEvaluation, FeatureFlagContext } from '@/lib/feature-flags-schema'

interface FeatureFlagsContextType {
  // Flag evaluation
  isEnabled: (flagKey: string) => boolean
  getValue: <T = any>(flagKey: string, defaultValue?: T) => T
  getEvaluation: (flagKey: string) => FeatureFlagEvaluation | null
  
  // Batch operations
  evaluateFlags: (flagKeys: string[]) => Promise<Record<string, FeatureFlagEvaluation>>
  
  // State
  flags: Record<string, FeatureFlagEvaluation>
  isLoading: boolean
  error: string | null
  
  // Management
  refresh: () => Promise<void>
  preloadFlags: (flagKeys: string[]) => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined)

interface FeatureFlagsProviderProps {
  children: ReactNode
  environment?: string
  preloadedFlags?: string[]
  autoRefreshInterval?: number
}

export function FeatureFlagsProvider({ 
  children, 
  environment = 'production',
  preloadedFlags = [],
  autoRefreshInterval = 5 * 60 * 1000 // 5 minutes
}: FeatureFlagsProviderProps) {
  const { user } = useAuth()
  const [flags, setFlags] = useState<Record<string, FeatureFlagEvaluation>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Build evaluation context
  const buildContext = useCallback((): FeatureFlagContext => {
    return {
      userId: user?.id,
      tenantId: user?.tenant_id,
      environment,
      userProperties: {
        email: user?.email,
        plan: user?.subscription_plan,
        role: user?.role,
        company: user?.company,
        createdAt: user?.created_at,
        lastLogin: user?.last_login
      },
      customProperties: {}
    }
  }, [user, tenant, environment])

  // Evaluate a single flag
  const evaluateFlag = useCallback(async (flagKey: string): Promise<FeatureFlagEvaluation> => {
    try {
      const context = buildContext()
      const response = await fetch('/api/feature-flags/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagKey, context })
      })

      if (!response.ok) {
        throw new Error(`Failed to evaluate flag: ${response.statusText}`)
      }

      const evaluation = await response.json()
      return evaluation
    } catch (error) {
      console.error(`Error evaluating flag ${flagKey}:`, error)
      return {
        value: false,
        enabled: false,
        reason: 'EVALUATION_ERROR',
        flagKey
      }
    }
  }, [buildContext])

  // Evaluate multiple flags
  const evaluateFlags = useCallback(async (flagKeys: string[]): Promise<Record<string, FeatureFlagEvaluation>> => {
    try {
      const context = buildContext()
      const response = await fetch('/api/feature-flags/evaluate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagKeys, context })
      })

      if (!response.ok) {
        throw new Error(`Failed to evaluate flags: ${response.statusText}`)
      }

      const evaluations = await response.json()
      return evaluations
    } catch (error) {
      console.error('Error evaluating flags:', error)
      // Return default values for all flags
      return flagKeys.reduce((acc, flagKey) => {
        acc[flagKey] = {
          value: false,
          enabled: false,
          reason: 'EVALUATION_ERROR',
          flagKey
        }
        return acc
      }, {} as Record<string, FeatureFlagEvaluation>)
    }
  }, [buildContext])

  // Preload specific flags
  const preloadFlags = useCallback(async (flagKeys: string[]) => {
    if (flagKeys.length === 0) return
    
    setIsLoading(true)
    setError(null)

    try {
      const evaluations = await evaluateFlags(flagKeys)
      setFlags(prev => ({ ...prev, ...evaluations }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to preload flags')
    } finally {
      setIsLoading(false)
    }
  }, [evaluateFlags])

  // Refresh all known flags
  const refresh = useCallback(async () => {
    const flagKeys = Object.keys(flags)
    if (flagKeys.length > 0) {
      await preloadFlags(flagKeys)
    }
  }, [flags, preloadFlags])

  // Get flag value with caching and lazy loading
  const getValue = useCallback(<T = any>(flagKey: string, defaultValue?: T): T => {
    const evaluation = flags[flagKey]
    
    if (evaluation) {
      return evaluation.enabled ? evaluation.value : (defaultValue as T)
    }

    // Lazy load flag if not in cache
    evaluateFlag(flagKey).then(evaluation => {
      setFlags(prev => ({ ...prev, [flagKey]: evaluation }))
    })

    return defaultValue as T
  }, [flags, evaluateFlag])

  // Check if flag is enabled
  const isEnabled = useCallback((flagKey: string): boolean => {
    const evaluation = flags[flagKey]
    
    if (evaluation) {
      return evaluation.enabled
    }

    // Lazy load flag if not in cache
    evaluateFlag(flagKey).then(evaluation => {
      setFlags(prev => ({ ...prev, [flagKey]: evaluation }))
    })

    return false
  }, [flags, evaluateFlag])

  // Get full evaluation object
  const getEvaluation = useCallback((flagKey: string): FeatureFlagEvaluation | null => {
    const evaluation = flags[flagKey]
    
    if (evaluation) {
      return evaluation
    }

    // Lazy load flag if not in cache
    evaluateFlag(flagKey).then(evaluation => {
      setFlags(prev => ({ ...prev, [flagKey]: evaluation }))
    })

    return null
  }, [flags, evaluateFlag])

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(refresh, autoRefreshInterval)
      setRefreshInterval(interval)
      
      return () => {
        clearInterval(interval)
        setRefreshInterval(null)
      }
    }
  }, [refresh, autoRefreshInterval])

  // Preload flags when user or tenant changes
  useEffect(() => {
    if (user && preloadedFlags.length > 0) {
      preloadFlags(preloadedFlags)
    }
  }, [user, preloadFlags, preloadedFlags])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  const value: FeatureFlagsContextType = {
    isEnabled,
    getValue,
    getEvaluation,
    evaluateFlags,
    flags,
    isLoading,
    error,
    refresh,
    preloadFlags
  }

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

// Hook to use feature flags
export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider')
  }
  return context
}

// Hook for a specific flag
export function useFeatureFlag(flagKey: string, defaultValue?: any) {
  const { isEnabled, getValue, getEvaluation } = useFeatureFlags()
  
  return {
    isEnabled: isEnabled(flagKey),
    value: getValue(flagKey, defaultValue),
    evaluation: getEvaluation(flagKey)
  }
}

// Hook for multiple flags
export function useFeatureFlagsBatch(flagKeys: string[]) {
  const { flags, evaluateFlags, isLoading } = useFeatureFlags()
  const [batchFlags, setBatchFlags] = useState<Record<string, FeatureFlagEvaluation>>({})
  const [batchLoading, setBatchLoading] = useState(false)

  useEffect(() => {
    const loadBatch = async () => {
      setBatchLoading(true)
      try {
        const evaluations = await evaluateFlags(flagKeys)
        setBatchFlags(evaluations)
      } finally {
        setBatchLoading(false)
      }
    }

    if (flagKeys.length > 0) {
      loadBatch()
    }
  }, [flagKeys, evaluateFlags])

  return {
    flags: { ...flags, ...batchFlags },
    isLoading: isLoading || batchLoading
  }
}

// Higher-order component for conditional rendering
export function withFeatureFlag<P extends object>(
  flagKey: string,
  defaultValue: boolean = false
) {
  return function FeatureFlagWrapper(Component: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      const { isEnabled } = useFeatureFlag(flagKey, defaultValue)
      
      if (!isEnabled) {
        return null
      }
      
      return <Component {...props} />
    }
  }
}

// Component for conditional rendering
interface FeatureFlagProps {
  flag: string
  defaultValue?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function FeatureFlag({ flag, defaultValue = false, fallback = null, children }: FeatureFlagProps) {
  const { isEnabled } = useFeatureFlag(flag, defaultValue)
  
  return isEnabled ? <>{children}</> : <>{fallback}</>
}

// Component for value-based rendering
interface FeatureFlagValueProps<T = any> {
  flag: string
  defaultValue?: T
  children: (value: T, evaluation: FeatureFlagEvaluation | null) => ReactNode
}

export function FeatureFlagValue<T = any>({ flag, defaultValue, children }: FeatureFlagValueProps<T>) {
  const { value, evaluation } = useFeatureFlag(flag, defaultValue)
  
  return <>{children(value, evaluation)}</>
}
