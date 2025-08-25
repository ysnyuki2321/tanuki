import { createClient } from '@supabase/supabase-js'
import type { Database } from './database-schema'

// Lazy client instances
let _supabase: ReturnType<typeof createClient<Database>> | null = null
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null
let _isConfigured = false

// Safe environment variable getter
function getEnvVar(key: string): string | null {
  if (typeof window !== 'undefined') {
    // Client-side: check for injected env vars
    const clientEnv = (window as any).__ENV__ || {}
    return clientEnv[key] || null
  } else {
    // Server-side: use process.env
    return process.env[key] || null
  }
}

// Get Supabase configuration
function getSupabaseConfig() {
  return {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
  }
}

// Initialize Supabase client (lazy)
function initializeSupabase() {
  if (_supabase) return

  const config = getSupabaseConfig()
  
  if (!config.url || !config.anonKey) {
    console.warn('Supabase configuration not available - some features will be disabled')
    _isConfigured = false
    return
  }

  try {
    _supabase = createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

    // Initialize admin client if service key available
    if (config.serviceKey && typeof window === 'undefined') {
      _supabaseAdmin = createClient<Database>(config.url, config.serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }

    _isConfigured = true
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    _isConfigured = false
  }
}

// Get Supabase client (passive/lazy loading)
export function getSupabase() {
  if (!_supabase && !_isConfigured) {
    initializeSupabase()
  }
  return _supabase
}

// Get Supabase admin client (server-side only)
export function getSupabaseAdmin() {
  if (!_supabaseAdmin && typeof window === 'undefined') {
    initializeSupabase()
  }
  return _supabaseAdmin
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  if (!_isConfigured) {
    const config = getSupabaseConfig()
    _isConfigured = !!(config.url && config.anonKey)
  }
  return _isConfigured
}

// Reset clients (for config changes)
export function resetSupabaseClients() {
  _supabase = null
  _supabaseAdmin = null
  _isConfigured = false
}

// Get current user safely
export async function getCurrentUser() {
  const supabase = getSupabase()
  if (!supabase) return null
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.warn('Error getting current user:', error)
    return null
  }
}

// Utility to configure Supabase at runtime
export function configureSupabase(url: string, anonKey: string, serviceKey?: string) {
  // Store in client-side env
  if (typeof window !== 'undefined') {
    const clientEnv = (window as any).__ENV__ || {}
    clientEnv.NEXT_PUBLIC_SUPABASE_URL = url
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey
    if (serviceKey) {
      clientEnv.SUPABASE_SERVICE_ROLE_KEY = serviceKey
    }
    ;(window as any).__ENV__ = clientEnv
  }

  // Reset and reinitialize
  resetSupabaseClients()
  initializeSupabase()
  
  return isSupabaseConfigured()
}

// Legacy exports for compatibility
export const supabase = null // Will be replaced by getSupabase()
export const supabaseAdmin = null // Will be replaced by getSupabaseAdmin()

// Database types
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbFile = Database['public']['Tables']['files']['Row'] 
export type DbTenant = Database['public']['Tables']['tenants']['Row']
export type DbAdminConfig = Database['public']['Tables']['admin_config']['Row']
