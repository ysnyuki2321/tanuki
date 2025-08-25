// Database Schema với nguyên tắc: required fields = default null + manual input
// Tránh lỗi khi missing data, cho phép setup từ từ

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  
  // Profile info - default null, manual input
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  
  // System fields - default null, auto-generated or manual
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  
  // Subscription info - default null, manual setup
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires: string | null;
  
  // Limits - default null, set via admin
  storage_quota: number | null;
  file_count_limit: number | null;
  
  // Tenant info for white-label
  tenant_id: string | null;
  role: string | null; // 'user' | 'admin' | 'super_admin'
  
  // Settings - default null, manual config
  timezone: string | null;
  language: string | null;
  theme: string | null;
}

export interface File {
  id: string;
  user_id: string;
  
  // Basic info - some required, some null-safe
  name: string;
  original_name: string;
  path: string;
  
  // Meta data - default null, auto-detected or manual
  size: number | null;
  mime_type: string | null;
  file_type: string | null;
  extension: string | null;
  
  // Storage info - default null, set by system
  storage_provider: string | null; // 'supabase' | 's3' | 'gcs'
  storage_path: string | null;
  cdn_url: string | null;
  
  // Processing status - default null
  processing_status: string | null; // 'pending' | 'processing' | 'completed' | 'failed'
  compression_status: string | null;
  virus_scan_status: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_accessed: string | null;
  
  // Sharing & permissions - default null
  is_public: boolean;
  share_token: string | null;
  expires_at: string | null;
  
  // Organization - default null, manual setup
  folder_id: string | null;
  project_id: string | null;
  tags: string[] | null;
  
  // Advanced features - default null
  version_number: number | null;
  parent_version_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface Tenant {
  id: string;
  
  // Basic info - required but can start as null
  name: string | null;
  slug: string | null; // for custom domain
  
  // Branding - all null by default, manual customization
  logo_url: string | null;
  brand_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
  
  // Domain setup - default null, manual config
  custom_domain: string | null;
  ssl_enabled: boolean;
  
  // Features - default null, set via admin
  enabled_features: string[] | null;
  storage_quota: number | null;
  user_limit: number | null;
  
  // Subscription - default null
  plan: string | null;
  billing_email: string | null;
  
  // Settings - default null, manual setup
  default_language: string | null;
  timezone: string | null;
  email_from_name: string | null;
  email_from_address: string | null;
  
  // SMTP config - default null, manual setup
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_secure: boolean;
  
  // Auth providers - default null, manual config
  google_oauth_enabled: boolean;
  github_oauth_enabled: boolean;
  saml_enabled: boolean;
  saml_config: any | null;
  
  created_at: string;
  updated_at: string;
  
  // Status - can be null initially
  status: string | null; // 'active' | 'suspended' | 'pending'
}

export interface AdminConfig {
  id: string;
  tenant_id: string | null; // null = global config
  
  // Configuration key-value pairs
  key: string;
  value: any | null; // JSON value, default null
  data_type: string; // 'string' | 'number' | 'boolean' | 'json'
  
  // Meta info - default null
  description: string | null;
  category: string | null;
  is_sensitive: boolean; // for passwords, API keys
  
  // Validation - default null
  validation_rules: any | null;
  default_value: any | null;
  
  created_at: string;
  updated_at: string;
  
  // Access control - default null
  editable_by_tenant: boolean;
  requires_restart: boolean;
}

// Helper functions cho null-safe operations
export const safeGetConfig = (config: AdminConfig | null, defaultValue: any = null) => {
  return config?.value ?? defaultValue;
};

export const safeGetUserField = <T>(user: User | null, field: keyof User, defaultValue: T): T => {
  return (user?.[field] as T) ?? defaultValue;
};

export const createUserWithDefaults = (email: string): Partial<User> => ({
  email,
  full_name: null,
  avatar_url: null,
  phone: null,
  company: null,
  email_verified: false,
  last_login: null,
  subscription_plan: null,
  subscription_status: null,
  subscription_expires: null,
  storage_quota: null,
  file_count_limit: null,
  tenant_id: null,
  role: null,
  timezone: null,
  language: null,
  theme: null,
});

export const createTenantWithDefaults = (): Partial<Tenant> => ({
  name: null,
  slug: null,
  logo_url: null,
  brand_color: null,
  secondary_color: null,
  font_family: null,
  custom_domain: null,
  ssl_enabled: false,
  enabled_features: null,
  storage_quota: null,
  user_limit: null,
  plan: null,
  billing_email: null,
  default_language: null,
  timezone: null,
  email_from_name: null,
  email_from_address: null,
  smtp_host: null,
  smtp_port: null,
  smtp_username: null,
  smtp_password: null,
  smtp_secure: false,
  google_oauth_enabled: false,
  github_oauth_enabled: false,
  saml_enabled: false,
  saml_config: null,
  status: null,
});
