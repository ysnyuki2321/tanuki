// Storage Providers Database Schema
// Extends existing database schema with storage provider configuration

export interface StorageProvidersDatabase {
  public: {
    Tables: {
      storage_providers: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          type: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
          bucket_name: string
          region: string | null
          encrypted_credentials: string // JSON string of encrypted credentials
          is_default: boolean
          is_active: boolean
          health_status: 'healthy' | 'unhealthy' | 'unknown'
          last_health_check: string | null
          response_time_ms: number | null
          created_by: string
          created_at: string
          updated_at: string
          config_options: any | null // Additional provider-specific options
          usage_stats: any | null // Usage statistics JSON
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          type: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
          bucket_name: string
          region?: string | null
          encrypted_credentials: string
          is_default?: boolean
          is_active?: boolean
          health_status?: 'healthy' | 'unhealthy' | 'unknown'
          last_health_check?: string | null
          response_time_ms?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
          config_options?: any | null
          usage_stats?: any | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          type?: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
          bucket_name?: string
          region?: string | null
          encrypted_credentials?: string
          is_default?: boolean
          is_active?: boolean
          health_status?: 'healthy' | 'unhealthy' | 'unknown'
          last_health_check?: string | null
          response_time_ms?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
          config_options?: any | null
          usage_stats?: any | null
        }
      }
      storage_usage_logs: {
        Row: {
          id: string
          tenant_id: string | null
          provider_id: string
          operation: 'upload' | 'download' | 'delete' | 'list' | 'copy' | 'move'
          file_key: string | null
          file_size: number | null
          duration_ms: number
          success: boolean
          error_code: string | null
          error_message: string | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          provider_id: string
          operation: 'upload' | 'download' | 'delete' | 'list' | 'copy' | 'move'
          file_key?: string | null
          file_size?: number | null
          duration_ms: number
          success: boolean
          error_code?: string | null
          error_message?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          provider_id?: string
          operation?: 'upload' | 'download' | 'delete' | 'list' | 'copy' | 'move'
          file_key?: string | null
          file_size?: number | null
          duration_ms?: number
          success?: boolean
          error_code?: string | null
          error_message?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Type exports
export type DbStorageProvider = StorageProvidersDatabase['public']['Tables']['storage_providers']['Row']
export type DbStorageUsageLog = StorageProvidersDatabase['public']['Tables']['storage_usage_logs']['Row']

// SQL Migration for creating storage providers tables
export const STORAGE_PROVIDERS_MIGRATION = `
-- Storage Providers table
CREATE TABLE IF NOT EXISTS storage_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('supabase', 's3', 'gcs', 'azure', 'local')),
  bucket_name TEXT NOT NULL,
  region TEXT,
  encrypted_credentials TEXT NOT NULL, -- JSON string of encrypted credentials
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  last_health_check TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  config_options JSONB, -- Additional provider-specific options
  usage_stats JSONB -- Usage statistics
);

-- Unique constraint for provider names per tenant
CREATE UNIQUE INDEX idx_storage_providers_name_tenant ON storage_providers(name, COALESCE(tenant_id::text, 'global'));

-- Ensure only one default provider per tenant
CREATE UNIQUE INDEX idx_storage_providers_default_tenant ON storage_providers(tenant_id, is_default) 
WHERE is_default = true;

-- Storage Usage Logs table
CREATE TABLE IF NOT EXISTS storage_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES storage_providers(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('upload', 'download', 'delete', 'list', 'copy', 'move')),
  file_key TEXT,
  file_size BIGINT,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_storage_providers_tenant ON storage_providers(tenant_id);
CREATE INDEX idx_storage_providers_type ON storage_providers(type);
CREATE INDEX idx_storage_providers_health ON storage_providers(health_status, last_health_check);
CREATE INDEX idx_storage_providers_default ON storage_providers(is_default, is_active);

CREATE INDEX idx_storage_usage_logs_provider ON storage_usage_logs(provider_id, created_at DESC);
CREATE INDEX idx_storage_usage_logs_tenant_time ON storage_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_storage_usage_logs_operation ON storage_usage_logs(operation, created_at DESC);
CREATE INDEX idx_storage_usage_logs_user ON storage_usage_logs(user_id, created_at DESC);

-- RLS Policies for tenant isolation
ALTER TABLE storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for storage_providers
CREATE POLICY "storage_providers_tenant_isolation" ON storage_providers
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    tenant_id IS NULL -- Global providers
  );

-- Policies for storage_usage_logs
CREATE POLICY "storage_usage_logs_tenant_isolation" ON storage_usage_logs
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Update triggers
CREATE TRIGGER update_storage_providers_updated_at BEFORE UPDATE ON storage_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update usage statistics
CREATE OR REPLACE FUNCTION update_provider_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage statistics in storage_providers table
    UPDATE storage_providers
    SET usage_stats = COALESCE(usage_stats, '{}'::jsonb) || jsonb_build_object(
        'total_operations', COALESCE((usage_stats->>'total_operations')::int, 0) + 1,
        'last_operation', NEW.created_at,
        'success_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE success = true)::float / COUNT(*)) * 100, 2
            )
            FROM storage_usage_logs 
            WHERE provider_id = NEW.provider_id 
            AND created_at >= NOW() - INTERVAL '30 days'
        )
    )
    WHERE id = NEW.provider_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage stats
CREATE TRIGGER update_provider_usage_stats_trigger
    AFTER INSERT ON storage_usage_logs
    FOR EACH ROW EXECUTE FUNCTION update_provider_usage_stats();

-- Function to cleanup old usage logs
CREATE OR REPLACE FUNCTION cleanup_old_storage_usage_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM storage_usage_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add storage_provider column to files table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'storage_provider_id') THEN
        ALTER TABLE files ADD COLUMN storage_provider_id UUID REFERENCES storage_providers(id);
        CREATE INDEX idx_files_storage_provider ON files(storage_provider_id);
    END IF;
END $$;

-- Example data for default Supabase provider (uncomment and modify as needed)
/*
INSERT INTO storage_providers (name, type, bucket_name, encrypted_credentials, is_default, created_by)
VALUES (
    'Default Supabase Storage',
    'supabase',
    'files',
    '{"url":"YOUR_SUPABASE_URL","anonKey":"YOUR_ANON_KEY"}',
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;
*/
`;

// Helper functions for working with storage providers
export interface StorageProviderConfig {
  id: string
  name: string
  type: string
  bucketName: string
  region?: string
  credentials: Record<string, any>
  isDefault: boolean
  isActive: boolean
  healthStatus: string
  lastHealthCheck?: Date
  responseTimeMs?: number
}

export function encryptCredentials(credentials: Record<string, any>): string {
  // In production, use proper encryption
  return JSON.stringify(credentials)
}

export function decryptCredentials(encryptedCredentials: string): Record<string, any> {
  // In production, use proper decryption
  try {
    return JSON.parse(encryptedCredentials)
  } catch {
    return {}
  }
}

export function validateProviderCredentials(type: string, credentials: Record<string, any>): string[] {
  const errors: string[] = []

  switch (type) {
    case 'supabase':
      if (!credentials.url) errors.push('Supabase URL is required')
      if (!credentials.anonKey && !credentials.serviceKey) {
        errors.push('Either anon key or service key is required')
      }
      break

    case 's3':
      if (!credentials.accessKeyId) errors.push('AWS Access Key ID is required')
      if (!credentials.secretAccessKey) errors.push('AWS Secret Access Key is required')
      break

    case 'gcs':
      if (!credentials.projectId) errors.push('Google Cloud Project ID is required')
      if (!credentials.keyFilename && !credentials.credentials) {
        errors.push('Either key file path or service account credentials are required')
      }
      break

    case 'azure':
      if (!credentials.connectionString && (!credentials.accountName || !credentials.accountKey)) {
        errors.push('Either connection string or account name + account key are required')
      }
      break

    case 'local':
      if (!credentials.basePath) errors.push('Base path is required for local storage')
      break

    default:
      errors.push(`Unsupported provider type: ${type}`)
  }

  return errors
}
