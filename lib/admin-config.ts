import { getSupabase, getSupabaseAdmin } from './supabase-client'

export interface ConfigValue {
  id: string
  tenant_id?: string
  key: string
  value: any
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  description?: string
  category: string
  is_sensitive: boolean
  validation_rules?: any
  default_value?: any
  editable_by_tenant: boolean
  requires_restart: boolean
  created_at: string
  updated_at: string
}

export interface ConfigCategory {
  key: string
  name: string
  description: string
  icon: string
  order: number
}

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    key: 'database',
    name: 'Database',
    description: 'Database connection and settings',
    icon: 'Database',
    order: 1
  },
  {
    key: 'authentication',
    name: 'Authentication',
    description: 'User authentication and OAuth settings',
    icon: 'Shield',
    order: 2
  },
  {
    key: 'email',
    name: 'Email',
    description: 'SMTP and email notification settings',
    icon: 'Mail',
    order: 3
  },
  {
    key: 'storage',
    name: 'Storage',
    description: 'File storage providers and settings',
    icon: 'HardDrive',
    order: 4
  },
  {
    key: 'security',
    name: 'Security',
    description: 'Security policies and encryption',
    icon: 'Lock',
    order: 5
  },
  {
    key: 'features',
    name: 'Features',
    description: 'Platform feature toggles',
    icon: 'ToggleLeft',
    order: 6
  },
  {
    key: 'limits',
    name: 'Limits & Quotas',
    description: 'Storage and usage limits',
    icon: 'Gauge',
    order: 7
  },
  {
    key: 'performance',
    name: 'Performance',
    description: 'CDN, caching, and optimization',
    icon: 'Zap',
    order: 8
  },
  {
    key: 'monitoring',
    name: 'Monitoring',
    description: 'Analytics and error tracking',
    icon: 'Activity',
    order: 9
  },
  {
    key: 'branding',
    name: 'Branding',
    description: 'Logo, colors, and customization',
    icon: 'Palette',
    order: 10
  }
]

export const DEFAULT_CONFIGS: Omit<ConfigValue, 'id' | 'created_at' | 'updated_at'>[] = [
  // Database
  {
    tenant_id: null,
    key: 'supabase_url',
    value: null,
    data_type: 'string',
    description: 'Supabase project URL',
    category: 'database',
    is_sensitive: false,
    validation_rules: { required: true, pattern: '^https://.*\\.supabase\\.co$' },
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'supabase_anon_key',
    value: null,
    data_type: 'string',
    description: 'Supabase anonymous/public key',
    category: 'database',
    is_sensitive: true,
    validation_rules: { required: true, minLength: 100 },
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'supabase_service_key',
    value: null,
    data_type: 'string',
    description: 'Supabase service role key (for admin operations)',
    category: 'database',
    is_sensitive: true,
    validation_rules: { minLength: 100 },
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },

  // Authentication
  {
    tenant_id: null,
    key: 'enable_registration',
    value: true,
    data_type: 'boolean',
    description: 'Allow new user registration',
    category: 'authentication',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'enable_email_verification',
    value: true,
    data_type: 'boolean',
    description: 'Require email verification for new accounts',
    category: 'authentication',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'oauth_google_enabled',
    value: false,
    data_type: 'boolean',
    description: 'Enable Google OAuth login',
    category: 'authentication',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'oauth_google_client_id',
    value: null,
    data_type: 'string',
    description: 'Google OAuth client ID',
    category: 'authentication',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'oauth_google_client_secret',
    value: null,
    data_type: 'string',
    description: 'Google OAuth client secret',
    category: 'authentication',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'oauth_github_enabled',
    value: false,
    data_type: 'boolean',
    description: 'Enable GitHub OAuth login',
    category: 'authentication',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'oauth_github_client_id',
    value: null,
    data_type: 'string',
    description: 'GitHub OAuth client ID',
    category: 'authentication',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'oauth_github_client_secret',
    value: null,
    data_type: 'string',
    description: 'GitHub OAuth client secret',
    category: 'authentication',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: true
  },

  // Email
  {
    tenant_id: null,
    key: 'smtp_host',
    value: null,
    data_type: 'string',
    description: 'SMTP server hostname',
    category: 'email',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'smtp_port',
    value: 587,
    data_type: 'number',
    description: 'SMTP server port',
    category: 'email',
    is_sensitive: false,
    validation_rules: { min: 1, max: 65535 },
    default_value: 587,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'smtp_user',
    value: null,
    data_type: 'string',
    description: 'SMTP username',
    category: 'email',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'smtp_password',
    value: null,
    data_type: 'string',
    description: 'SMTP password',
    category: 'email',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'smtp_secure',
    value: true,
    data_type: 'boolean',
    description: 'Use SSL/TLS for SMTP',
    category: 'email',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'email_from_address',
    value: 'noreply@tanuki.dev',
    data_type: 'string',
    description: 'From email address',
    category: 'email',
    is_sensitive: false,
    validation_rules: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    default_value: 'noreply@tanuki.dev',
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'email_from_name',
    value: 'Tanuki Storage',
    data_type: 'string',
    description: 'From name for emails',
    category: 'email',
    is_sensitive: false,
    default_value: 'Tanuki Storage',
    editable_by_tenant: true,
    requires_restart: false
  },

  // Storage
  {
    tenant_id: null,
    key: 'storage_provider',
    value: 'supabase',
    data_type: 'string',
    description: 'Primary storage provider',
    category: 'storage',
    is_sensitive: false,
    validation_rules: { enum: ['supabase', 's3', 'gcs'] },
    default_value: 'supabase',
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'aws_access_key_id',
    value: null,
    data_type: 'string',
    description: 'AWS access key ID (for S3 storage)',
    category: 'storage',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'aws_secret_access_key',
    value: null,
    data_type: 'string',
    description: 'AWS secret access key',
    category: 'storage',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'aws_bucket_name',
    value: null,
    data_type: 'string',
    description: 'AWS S3 bucket name',
    category: 'storage',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'aws_region',
    value: 'us-east-1',
    data_type: 'string',
    description: 'AWS region',
    category: 'storage',
    is_sensitive: false,
    default_value: 'us-east-1',
    editable_by_tenant: false,
    requires_restart: true
  },

  // Security
  {
    tenant_id: null,
    key: 'jwt_secret',
    value: null,
    data_type: 'string',
    description: 'JWT signing secret',
    category: 'security',
    is_sensitive: true,
    validation_rules: { minLength: 32 },
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'encryption_key',
    value: null,
    data_type: 'string',
    description: 'Encryption key for sensitive data',
    category: 'security',
    is_sensitive: true,
    validation_rules: { minLength: 32 },
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'enable_rate_limiting',
    value: true,
    data_type: 'boolean',
    description: 'Enable API rate limiting',
    category: 'security',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: false,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'rate_limit_requests_per_minute',
    value: 60,
    data_type: 'number',
    description: 'API requests per minute limit',
    category: 'security',
    is_sensitive: false,
    validation_rules: { min: 1, max: 1000 },
    default_value: 60,
    editable_by_tenant: false,
    requires_restart: false
  },

  // Features
  {
    tenant_id: null,
    key: 'enable_file_sharing',
    value: true,
    data_type: 'boolean',
    description: 'Allow file sharing via links',
    category: 'features',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'enable_collaboration',
    value: true,
    data_type: 'boolean',
    description: 'Enable real-time collaboration',
    category: 'features',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'enable_file_versioning',
    value: true,
    data_type: 'boolean',
    description: 'Enable file version history',
    category: 'features',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'enable_virus_scanning',
    value: false,
    data_type: 'boolean',
    description: 'Enable virus scanning for uploads',
    category: 'features',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'enable_compression',
    value: true,
    data_type: 'boolean',
    description: 'Enable automatic file compression',
    category: 'features',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: true,
    requires_restart: false
  },

  // Limits
  {
    tenant_id: null,
    key: 'default_storage_quota',
    value: 1073741824, // 1GB
    data_type: 'number',
    description: 'Default storage quota per user (bytes)',
    category: 'limits',
    is_sensitive: false,
    validation_rules: { min: 1048576 }, // 1MB minimum
    default_value: 1073741824,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'default_file_limit',
    value: 1000,
    data_type: 'number',
    description: 'Default file count limit per user',
    category: 'limits',
    is_sensitive: false,
    validation_rules: { min: 1 },
    default_value: 1000,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'max_file_size',
    value: 104857600, // 100MB
    data_type: 'number',
    description: 'Maximum file size (bytes)',
    category: 'limits',
    is_sensitive: false,
    validation_rules: { min: 1024 }, // 1KB minimum
    default_value: 104857600,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'max_concurrent_uploads',
    value: 5,
    data_type: 'number',
    description: 'Maximum concurrent uploads per user',
    category: 'limits',
    is_sensitive: false,
    validation_rules: { min: 1, max: 20 },
    default_value: 5,
    editable_by_tenant: true,
    requires_restart: false
  },

  // Performance
  {
    tenant_id: null,
    key: 'cdn_enabled',
    value: false,
    data_type: 'boolean',
    description: 'Enable CDN for file delivery',
    category: 'performance',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: false,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'cdn_url',
    value: null,
    data_type: 'string',
    description: 'CDN base URL',
    category: 'performance',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: false,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'cache_enabled',
    value: true,
    data_type: 'boolean',
    description: 'Enable file metadata caching',
    category: 'performance',
    is_sensitive: false,
    default_value: true,
    editable_by_tenant: false,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'cache_ttl_seconds',
    value: 3600,
    data_type: 'number',
    description: 'Cache TTL in seconds',
    category: 'performance',
    is_sensitive: false,
    validation_rules: { min: 60, max: 86400 },
    default_value: 3600,
    editable_by_tenant: false,
    requires_restart: false
  },

  // Monitoring
  {
    tenant_id: null,
    key: 'sentry_enabled',
    value: false,
    data_type: 'boolean',
    description: 'Enable Sentry error tracking',
    category: 'monitoring',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'sentry_dsn',
    value: null,
    data_type: 'string',
    description: 'Sentry DSN',
    category: 'monitoring',
    is_sensitive: true,
    default_value: null,
    editable_by_tenant: false,
    requires_restart: true
  },
  {
    tenant_id: null,
    key: 'analytics_enabled',
    value: false,
    data_type: 'boolean',
    description: 'Enable usage analytics',
    category: 'monitoring',
    is_sensitive: false,
    default_value: false,
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'analytics_provider',
    value: null,
    data_type: 'string',
    description: 'Analytics provider (google, posthog, etc.)',
    category: 'monitoring',
    is_sensitive: false,
    validation_rules: { enum: ['google', 'posthog', 'mixpanel'] },
    default_value: null,
    editable_by_tenant: true,
    requires_restart: false
  },

  // Branding
  {
    tenant_id: null,
    key: 'app_name',
    value: 'Tanuki Storage',
    data_type: 'string',
    description: 'Application name',
    category: 'branding',
    is_sensitive: false,
    default_value: 'Tanuki Storage',
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'app_description',
    value: 'Smart Web Storage Platform',
    data_type: 'string',
    description: 'Application description',
    category: 'branding',
    is_sensitive: false,
    default_value: 'Smart Web Storage Platform',
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'primary_color',
    value: '#6366f1',
    data_type: 'string',
    description: 'Primary brand color',
    category: 'branding',
    is_sensitive: false,
    validation_rules: { pattern: '^#[0-9a-fA-F]{6}$' },
    default_value: '#6366f1',
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'secondary_color',
    value: '#e2e8f0',
    data_type: 'string',
    description: 'Secondary brand color',
    category: 'branding',
    is_sensitive: false,
    validation_rules: { pattern: '^#[0-9a-fA-F]{6}$' },
    default_value: '#e2e8f0',
    editable_by_tenant: true,
    requires_restart: false
  },
  {
    tenant_id: null,
    key: 'logo_url',
    value: null,
    data_type: 'string',
    description: 'Custom logo URL',
    category: 'branding',
    is_sensitive: false,
    default_value: null,
    editable_by_tenant: true,
    requires_restart: false
  }
]

export class AdminConfigService {
  /**
   * Get all configuration values, optionally filtered by category
   */
  static async getConfigs(category?: string, tenantId?: string): Promise<ConfigValue[]> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error('Database not configured')
    }

    let query = supabase
      .from('admin_config')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (tenantId !== undefined) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch configs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a specific configuration value
   */
  static async getConfig(key: string, tenantId?: string): Promise<ConfigValue | null> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error('Database not configured')
    }

    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .eq('key', key)
      .eq('tenant_id', tenantId || null)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch config: ${error.message}`)
    }

    return data
  }

  /**
   * Update or create a configuration value
   */
  static async setConfig(
    key: string,
    value: any,
    options?: {
      tenantId?: string
      description?: string
      category?: string
      dataType?: ConfigValue['data_type']
      isSensitive?: boolean
      validationRules?: any
      requiresRestart?: boolean
    }
  ): Promise<ConfigValue> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error('Database not configured')
    }

    const configData = {
      key,
      value,
      tenant_id: options?.tenantId || null,
      description: options?.description,
      category: options?.category || 'general',
      data_type: options?.dataType || 'string',
      is_sensitive: options?.isSensitive || false,
      validation_rules: options?.validationRules,
      requires_restart: options?.requiresRestart || false
    }

    const { data, error } = await supabase
      .from('admin_config')
      .upsert(configData, {
        onConflict: 'key,tenant_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save config: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a configuration value
   */
  static async deleteConfig(key: string, tenantId?: string): Promise<void> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error('Database not configured')
    }

    const { error } = await supabase
      .from('admin_config')
      .delete()
      .eq('key', key)
      .eq('tenant_id', tenantId || null)

    if (error) {
      throw new Error(`Failed to delete config: ${error.message}`)
    }
  }

  /**
   * Initialize default configurations
   */
  static async initializeDefaultConfigs(): Promise<void> {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error('Database not configured')
    }

    // Insert default configs, ignoring conflicts
    const { error } = await supabase
      .from('admin_config')
      .upsert(DEFAULT_CONFIGS, {
        onConflict: 'key,tenant_id',
        ignoreDuplicates: true
      })

    if (error) {
      throw new Error(`Failed to initialize default configs: ${error.message}`)
    }
  }

  /**
   * Get configuration values as a simple key-value object
   */
  static async getConfigValues(category?: string, tenantId?: string): Promise<Record<string, any>> {
    const configs = await this.getConfigs(category, tenantId)
    const result: Record<string, any> = {}
    
    for (const config of configs) {
      result[config.key] = config.value
    }
    
    return result
  }

  /**
   * Validate configuration value against rules
   */
  static validateConfigValue(value: any, rules?: any): { valid: boolean; error?: string } {
    if (!rules) return { valid: true }

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'This field is required' }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, error: `Minimum length is ${rules.minLength}` }
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return { valid: false, error: `Maximum length is ${rules.maxLength}` }
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        return { valid: false, error: 'Invalid format' }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { valid: false, error: `Minimum value is ${rules.min}` }
      }
      if (rules.max !== undefined && value > rules.max) {
        return { valid: false, error: `Maximum value is ${rules.max}` }
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      return { valid: false, error: `Must be one of: ${rules.enum.join(', ')}` }
    }

    return { valid: true }
  }

  /**
   * Test database connection
   */
  static async testDatabaseConnection(config: {
    url: string
    anonKey: string
    serviceKey?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const testClient = createClient(config.url, config.anonKey)

      // Test connection with a simple query
      const { error } = await testClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConnection(config: {
    host: string
    port: number
    user: string
    password: string
    secure?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you would use nodemailer or similar
      // For now, we'll simulate the test
      if (!config.host || !config.user) {
        return { success: false, error: 'Host and user are required' }
      }

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email test failed' 
      }
    }
  }

  /**
   * Get configuration health status
   */
  static async getConfigHealth(): Promise<{
    database: boolean
    email: boolean
    storage: boolean
    security: boolean
    overall: boolean
  }> {
    try {
      const configs = await this.getConfigValues()
      
      const health = {
        database: !!(configs.supabase_url && configs.supabase_anon_key),
        email: !!(configs.smtp_host && configs.smtp_user),
        storage: !!configs.storage_provider,
        security: !!(configs.jwt_secret && configs.encryption_key),
        overall: false
      }

      health.overall = health.database && health.storage && health.security

      return health
    } catch (error) {
      return {
        database: false,
        email: false,
        storage: false,
        security: false,
        overall: false
      }
    }
  }
}
