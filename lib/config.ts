// Environment Config với null-safe defaults
// Tránh lỗi khi missing env vars, cho phép setup từ từ

interface AppConfig {
  // Database - required but can be null initially
  supabase_url: string | null;
  supabase_anon_key: string | null;
  supabase_service_key: string | null;
  
  // App settings - default values
  app_name: string;
  app_url: string;
  app_description: string;
  
  // Email settings - default null, manual setup
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  from_email: string | null;
  from_name: string | null;
  
  // Storage settings - default null
  storage_provider: string | null; // 'supabase' | 's3' | 'gcs'
  aws_access_key: string | null;
  aws_secret_key: string | null;
  aws_bucket: string | null;
  aws_region: string | null;

  // Google Cloud Storage settings
  gcs_project_id: string | null;
  gcs_key_file: string | null;
  gcs_bucket: string | null;
  
  // Payment gateways - default null
  stripe_public_key: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  paypal_client_id: string | null;
  paypal_client_secret: string | null;
  
  // OAuth providers - default null
  google_client_id: string | null;
  google_client_secret: string | null;
  github_client_id: string | null;
  github_client_secret: string | null;
  
  // Security - default null, auto-generated if missing
  jwt_secret: string | null;
  encryption_key: string | null;
  
  // Features toggles - defaults
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_file_sharing: boolean;
  enable_collaboration: boolean;
  enable_virus_scan: boolean;
  enable_compression: boolean;
  
  // Limits - defaults
  default_storage_quota: number;
  default_file_limit: number;
  max_file_size: number;
  max_upload_concurrent: number;
  
  // CDN & Performance - default null
  cdn_url: string | null;
  redis_url: string | null;
  
  // Monitoring - default null
  sentry_dsn: string | null;
  analytics_id: string | null;
  
  // License & White-label - default null
  license_key: string | null;
  tenant_mode: boolean;
  allow_custom_domains: boolean;
}

// Get config với null-safe defaults
export const getConfig = (): AppConfig => {
  // Safe environment access for both client and server
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
    
    // App settings với defaults
    app_name: env.NEXT_PUBLIC_APP_NAME || 'Tanuki Storage',
    app_url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    app_description: env.NEXT_PUBLIC_APP_DESCRIPTION || 'Smart Web Storage Platform',
    
    // Email - tất cả null by default
    smtp_host: env.SMTP_HOST || null,
    smtp_port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : null,
    smtp_user: env.SMTP_USER || null,
    smtp_pass: env.SMTP_PASS || null,
    from_email: env.FROM_EMAIL || null,
    from_name: env.FROM_NAME || null,
    
    // Storage
    storage_provider: env.STORAGE_PROVIDER || null,
    aws_access_key: env.AWS_ACCESS_KEY_ID || null,
    aws_secret_key: env.AWS_SECRET_ACCESS_KEY || null,
    aws_bucket: env.AWS_BUCKET || null,
    aws_region: env.AWS_REGION || null,

    // Google Cloud Storage
    gcs_project_id: env.GCS_PROJECT_ID || null,
    gcs_key_file: env.GCS_KEY_FILE || null,
    gcs_bucket: env.GCS_BUCKET || null,
    
    // Payment
    stripe_public_key: env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || null,
    stripe_secret_key: env.STRIPE_SECRET_KEY || null,
    stripe_webhook_secret: env.STRIPE_WEBHOOK_SECRET || null,
    paypal_client_id: env.PAYPAL_CLIENT_ID || null,
    paypal_client_secret: env.PAYPAL_CLIENT_SECRET || null,
    
    // OAuth
    google_client_id: env.GOOGLE_CLIENT_ID || null,
    google_client_secret: env.GOOGLE_CLIENT_SECRET || null,
    github_client_id: env.GITHUB_CLIENT_ID || null,
    github_client_secret: env.GITHUB_CLIENT_SECRET || null,
    
    // Security
    jwt_secret: env.JWT_SECRET || null,
    encryption_key: env.ENCRYPTION_KEY || null,
    
    // Features với defaults
    enable_registration: env.ENABLE_REGISTRATION !== 'false',
    enable_email_verification: env.ENABLE_EMAIL_VERIFICATION !== 'false',
    enable_file_sharing: env.ENABLE_FILE_SHARING !== 'false',
    enable_collaboration: env.ENABLE_COLLABORATION !== 'false',
    enable_virus_scan: env.ENABLE_VIRUS_SCAN === 'true',
    enable_compression: env.ENABLE_COMPRESSION !== 'false',
    
    // Limits với defaults
    default_storage_quota: parseInt(env.DEFAULT_STORAGE_QUOTA || '1073741824'), // 1GB
    default_file_limit: parseInt(env.DEFAULT_FILE_LIMIT || '1000'),
    max_file_size: parseInt(env.MAX_FILE_SIZE || '104857600'), // 100MB
    max_upload_concurrent: parseInt(env.MAX_UPLOAD_CONCURRENT || '5'),
    
    // CDN & Performance
    cdn_url: env.CDN_URL || null,
    redis_url: env.REDIS_URL || null,
    
    // Monitoring
    sentry_dsn: env.SENTRY_DSN || null,
    analytics_id: env.ANALYTICS_ID || null,
    
    // License & White-label
    license_key: env.LICENSE_KEY || null,
    tenant_mode: env.TENANT_MODE === 'true',
    allow_custom_domains: env.ALLOW_CUSTOM_DOMAINS === 'true',
  };
};

// Validation helpers
export const validateConfig = (config: AppConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check critical configs
  if (!config.supabase_url) {
    errors.push('Supabase URL is required. Please connect to Supabase first.');
  }
  
  if (!config.supabase_anon_key) {
    errors.push('Supabase Anon Key is required. Please connect to Supabase first.');
  }
  
  // Check email config if email features enabled
  if (config.enable_email_verification && !config.smtp_host) {
    errors.push('SMTP configuration required for email verification. Set SMTP_HOST or disable email verification.');
  }
  
  // Check payment config if needed
  if (config.stripe_public_key && !config.stripe_secret_key) {
    errors.push('Stripe Secret Key is required when Stripe Public Key is set.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper to check if feature is enabled and properly configured
export const isFeatureEnabled = (feature: keyof AppConfig, config: AppConfig = getConfig()): boolean => {
  const value = config[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For string configs, check if not null and not empty
  if (typeof value === 'string') {
    return value !== null && value.trim() !== '';
  }
  
  return value !== null;
};

// Get config value with fallback
export const getConfigValue = <T>(key: keyof AppConfig, fallback: T, config: AppConfig = getConfig()): T => {
  const value = config[key];
  return (value as T) ?? fallback;
};

// Setup wizard helper
export const getSetupStatus = (config: AppConfig = getConfig()) => {
  const validation = validateConfig(config);
  
  return {
    database_connected: !!(config.supabase_url && config.supabase_anon_key),
    email_configured: !!(config.smtp_host && config.smtp_user),
    storage_configured: !!(config.storage_provider),
    payment_configured: !!(config.stripe_public_key || config.paypal_client_id),
    security_configured: !!(config.jwt_secret && config.encryption_key),
    is_ready: validation.isValid,
    next_steps: validation.errors,
  };
};

export default getConfig;
