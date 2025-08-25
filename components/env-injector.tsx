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
