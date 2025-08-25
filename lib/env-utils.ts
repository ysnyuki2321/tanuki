// Server-side environment utilities
// This file runs on the server only and can access process.env safely

// Server-side helper to get safe environment variables for client injection
export function getClientSafeEnvVars(): Record<string, string> {
  const safeEnvVars: Record<string, string> = {}
  
  // Only include client-safe environment variables (NEXT_PUBLIC_* and specific safe ones)
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

// Get app configuration safely on server
export function getServerConfig() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Tanuki Storage',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Smart Web Storage Platform',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }
}

// Check if critical services are configured
export function isConfiguredOnServer() {
  const config = getServerConfig()
  return {
    database: !!(config.supabaseUrl && config.supabaseAnonKey),
    hasServiceKey: !!config.supabaseServiceKey,
  }
}
