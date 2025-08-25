"use client"

import { useEffect } from 'react'

interface EnvInjectorProps {
  envVars?: Record<string, string>
}

export default function EnvInjector({ envVars }: EnvInjectorProps) {
  useEffect(() => {
    // Inject environment variables into client-side
    if (typeof window !== 'undefined' && envVars) {
      ;(window as any).__ENV__ = {
        ...(window as any).__ENV__,
        ...envVars
      }
    }
  }, [envVars])

  return null // This component doesn't render anything
}

// Server-side helper to get safe environment variables
export function getClientSafeEnvVars(): Record<string, string> {
  const safeEnvVars: Record<string, string> = {}
  
  // Only include client-safe environment variables
  const clientSafeKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_APP_DESCRIPTION',
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY'
  ]

  clientSafeKeys.forEach(key => {
    if (process.env[key]) {
      safeEnvVars[key] = process.env[key] as string
    }
  })

  return safeEnvVars
}
