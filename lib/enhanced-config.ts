import { AdminConfigService } from './admin-config'

// Cache for configuration values
let configCache: Record<string, any> = {}
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface AppConfig {
  // Database - required but can be null initially
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_service_key: string | null
  
  // App settings - default values
  app_name: string
  app_description: string
  
  // Email settings - default null, manual setup
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_password: string | null
  email_from_address: string | null
  email_from_name: string | null
  smtp_secure: boolean
  
  // Storage settings - default null
  storage_provider: string | null // 'supabase' | 's3' | 'gcs'
  aws_access_key_id: string | null
  aws_secret_access_key: string | null
  aws_bucket_name: string | null
  aws_region: string | null
  
  // OAuth providers - default null
  oauth_google_enabled: boolean
  oauth_google_client_id: string | null
  oauth_google_client_secret: string | null
  oauth_github_enabled: boolean
  oauth_github_client_id: string | null
  oauth_github_client_secret: string | null
  
  // Security - default null, auto-generated if missing
  jwt_secret: string | null
  encryption_key: string | null
  enable_rate_limiting: boolean
  rate_limit_requests_per_minute: number
  
  // Features toggles - defaults
  enable_registration: boolean
  enable_email_verification: boolean
  enable_file_sharing: boolean
  enable_collaboration: boolean
  enable_file_versioning: boolean
  enable_virus_scanning: boolean
  enable_compression: boolean
  
  // Limits - defaults
  default_storage_quota: number
  default_file_limit: number
  max_file_size: number
  max_concurrent_uploads: number
  
  // Performance - default null
  cdn_enabled: boolean
  cdn_url: string | null
  cache_enabled: boolean
  cache_ttl_seconds: number
  
  // Monitoring - default null
  sentry_enabled: boolean
  sentry_dsn: string | null
  analytics_enabled: boolean
  analytics_provider: string | null
  
  // Branding
  primary_color: string
  secondary_color: string
  logo_url: string | null
}

// Environment fallback function
function getEnvConfig(): Partial<AppConfig> {
  let env: Record<string, string | undefined>

  if (typeof window === 'undefined') {
    // Server-side: use process.env
    env = process.env
  } else {
    // Client-side: use injected env vars with fallback
    env = (window as any).__ENV__ || {}

    // Fallback to any NEXT_PUBLIC_ vars that might be available
    try {
      if (typeof process !== 'undefined' && process?.env) {
        Object.keys(process.env).forEach(key => {
          if (key.startsWith('NEXT_PUBLIC_') && !env[key]) {
            env[key] = process.env[key]
          }
        })
      }
    } catch (error) {
      // Ignore process access errors on client-side
      console.debug('Process env access not available on client side')
    }
  }

  return {
    // Database
    supabase_url: env.NEXT_PUBLIC_SUPABASE_URL || null,
    supabase_anon_key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
    supabase_service_key: env.SUPABASE_SERVICE_ROLE_KEY || null,
    
    // App settings
    app_name: env.NEXT_PUBLIC_APP_NAME || 'Tanuki Storage',
    app_description: env.NEXT_PUBLIC_APP_DESCRIPTION || 'Smart Web Storage Platform',
    
    // Email
    smtp_host: env.SMTP_HOST || null,
    smtp_port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : null,
    smtp_user: env.SMTP_USER || null,
    smtp_password: env.SMTP_PASSWORD || null,
    email_from_address: env.EMAIL_FROM_ADDRESS || null,
    email_from_name: env.EMAIL_FROM_NAME || null,
    smtp_secure: env.SMTP_SECURE !== 'false',
    
    // Storage
    storage_provider: env.STORAGE_PROVIDER || null,
    aws_access_key_id: env.AWS_ACCESS_KEY_ID || null,
    aws_secret_access_key: env.AWS_SECRET_ACCESS_KEY || null,
    aws_bucket_name: env.AWS_BUCKET_NAME || null,
    aws_region: env.AWS_REGION || null,
    
    // OAuth
    oauth_google_enabled: env.OAUTH_GOOGLE_ENABLED === 'true',
    oauth_google_client_id: env.OAUTH_GOOGLE_CLIENT_ID || null,
    oauth_google_client_secret: env.OAUTH_GOOGLE_CLIENT_SECRET || null,
    oauth_github_enabled: env.OAUTH_GITHUB_ENABLED === 'true',
    oauth_github_client_id: env.OAUTH_GITHUB_CLIENT_ID || null,
    oauth_github_client_secret: env.OAUTH_GITHUB_CLIENT_SECRET || null,
    
    // Security
    jwt_secret: env.JWT_SECRET || null,
    encryption_key: env.ENCRYPTION_KEY || null,
    enable_rate_limiting: env.ENABLE_RATE_LIMITING !== 'false',
    rate_limit_requests_per_minute: parseInt(env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    
    // Features
    enable_registration: env.ENABLE_REGISTRATION !== 'false',
    enable_email_verification: env.ENABLE_EMAIL_VERIFICATION !== 'false',
    enable_file_sharing: env.ENABLE_FILE_SHARING !== 'false',
    enable_collaboration: env.ENABLE_COLLABORATION !== 'false',
    enable_file_versioning: env.ENABLE_FILE_VERSIONING !== 'false',
    enable_virus_scanning: env.ENABLE_VIRUS_SCANNING === 'true',
    enable_compression: env.ENABLE_COMPRESSION !== 'false',
    
    // Limits
    default_storage_quota: parseInt(env.DEFAULT_STORAGE_QUOTA || '1073741824'), // 1GB
    default_file_limit: parseInt(env.DEFAULT_FILE_LIMIT || '1000'),
    max_file_size: parseInt(env.MAX_FILE_SIZE || '104857600'), // 100MB
    max_concurrent_uploads: parseInt(env.MAX_CONCURRENT_UPLOADS || '5'),
    
    // Performance
    cdn_enabled: env.CDN_ENABLED === 'true',
    cdn_url: env.CDN_URL || null,
    cache_enabled: env.CACHE_ENABLED !== 'false',
    cache_ttl_seconds: parseInt(env.CACHE_TTL_SECONDS || '3600'),
    
    // Monitoring
    sentry_enabled: env.SENTRY_ENABLED === 'true',
    sentry_dsn: env.SENTRY_DSN || null,
    analytics_enabled: env.ANALYTICS_ENABLED === 'true',
    analytics_provider: env.ANALYTICS_PROVIDER || null,
    
    // Branding
    primary_color: env.PRIMARY_COLOR || '#6366f1',
    secondary_color: env.SECONDARY_COLOR || '#e2e8f0',
    logo_url: env.LOGO_URL || null
  }
}

// Default configuration values
const DEFAULT_CONFIG: AppConfig = {
  // Database
  supabase_url: null,
  supabase_anon_key: null,
  supabase_service_key: null,
  
  // App settings
  app_name: 'Tanuki Storage',
  app_description: 'Smart Web Storage Platform',
  
  // Email
  smtp_host: null,
  smtp_port: null,
  smtp_user: null,
  smtp_password: null,
  email_from_address: null,
  email_from_name: null,
  smtp_secure: true,
  
  // Storage
  storage_provider: null,
  aws_access_key_id: null,
  aws_secret_access_key: null,
  aws_bucket_name: null,
  aws_region: null,
  
  // OAuth
  oauth_google_enabled: false,
  oauth_google_client_id: null,
  oauth_google_client_secret: null,
  oauth_github_enabled: false,
  oauth_github_client_id: null,
  oauth_github_client_secret: null,
  
  // Security
  jwt_secret: null,
  encryption_key: null,
  enable_rate_limiting: true,
  rate_limit_requests_per_minute: 60,
  
  // Features
  enable_registration: true,
  enable_email_verification: true,
  enable_file_sharing: true,
  enable_collaboration: true,
  enable_file_versioning: true,
  enable_virus_scanning: false,
  enable_compression: true,
  
  // Limits
  default_storage_quota: 1073741824, // 1GB
  default_file_limit: 1000,
  max_file_size: 104857600, // 100MB
  max_concurrent_uploads: 5,
  
  // Performance
  cdn_enabled: false,
  cdn_url: null,
  cache_enabled: true,
  cache_ttl_seconds: 3600,
  
  // Monitoring
  sentry_enabled: false,
  sentry_dsn: null,
  analytics_enabled: false,
  analytics_provider: null,
  
  // Branding
  primary_color: '#6366f1',
  secondary_color: '#e2e8f0',
  logo_url: null
}

/**
 * Get configuration from database with fallback to environment variables
 */
export async function getEnhancedConfig(): Promise<AppConfig> {
  try {
    // Check cache first
    const now = Date.now()
    if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
      return { ...DEFAULT_CONFIG, ...getEnvConfig(), ...configCache }
    }

    // Try to load from database
    const dbConfigs = await AdminConfigService.getConfigValues()
    
    // Update cache
    configCache = dbConfigs
    cacheTimestamp = now
    
    // Merge: defaults < environment < database
    return {
      ...DEFAULT_CONFIG,
      ...getEnvConfig(),
      ...dbConfigs
    }
  } catch (error) {
    console.warn('Failed to load config from database, using environment fallback:', error)
    
    // Fallback to environment + defaults
    return {
      ...DEFAULT_CONFIG,
      ...getEnvConfig()
    }
  }
}

/**
 * Get configuration synchronously (uses cache or environment)
 */
export function getConfig(): AppConfig {
  // If we have cached config, use it
  if (configCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return { ...DEFAULT_CONFIG, ...getEnvConfig(), ...configCache }
  }
  
  // Otherwise use environment + defaults
  return {
    ...DEFAULT_CONFIG,
    ...getEnvConfig()
  }
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(): void {
  configCache = {}
  cacheTimestamp = 0
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig, config?: AppConfig): boolean {
  const currentConfig = config || getConfig()
  const value = currentConfig[feature]
  
  if (typeof value === 'boolean') {
    return value
  }
  
  // For string configs, check if not null and not empty
  if (typeof value === 'string') {
    return value !== null && value.trim() !== ''
  }
  
  return value !== null
}

/**
 * Get config value with fallback
 */
export function getConfigValue<T>(key: keyof AppConfig, fallback: T, config?: AppConfig): T {
  const currentConfig = config || getConfig()
  const value = currentConfig[key]
  return (value as T) ?? fallback
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check critical configs
  if (!config.supabase_url) {
    errors.push('Supabase URL is required. Please connect to Supabase first.')
  }
  
  if (!config.supabase_anon_key) {
    errors.push('Supabase Anon Key is required. Please connect to Supabase first.')
  }
  
  // Check email config if email features enabled
  if (config.enable_email_verification && !config.smtp_host) {
    errors.push('SMTP configuration required for email verification. Set SMTP_HOST or disable email verification.')
  }
  
  // Check OAuth config
  if (config.oauth_google_enabled && (!config.oauth_google_client_id || !config.oauth_google_client_secret)) {
    errors.push('Google OAuth client ID and secret are required when Google OAuth is enabled.')
  }
  
  if (config.oauth_github_enabled && (!config.oauth_github_client_id || !config.oauth_github_client_secret)) {
    errors.push('GitHub OAuth client ID and secret are required when GitHub OAuth is enabled.')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get setup status
 */
export async function getSetupStatus() {
  const config = await getEnhancedConfig()
  const validation = validateConfig(config)
  
  return {
    database_connected: !!(config.supabase_url && config.supabase_anon_key),
    email_configured: !!(config.smtp_host && config.smtp_user),
    storage_configured: !!(config.storage_provider),
    oauth_configured: config.oauth_google_enabled || config.oauth_github_enabled,
    security_configured: !!(config.jwt_secret && config.encryption_key),
    is_ready: validation.isValid,
    next_steps: validation.errors,
  }
}

export default getConfig
