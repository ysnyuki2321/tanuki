// Feature Flags Database Schema
// Extends existing database schema with comprehensive feature flags system

export interface FeatureFlagsDatabase {
  public: {
    Tables: {
      feature_flags: {
        Row: {
          id: string
          tenant_id: string | null // null for global flags
          key: string // unique identifier for the flag
          name: string
          description: string | null
          flag_type: 'boolean' | 'string' | 'number' | 'json'
          default_value: any
          is_global: boolean // global flags apply to all tenants
          status: 'active' | 'inactive' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
          environments: string[] // ['development', 'staging', 'production']
          tags: string[] | null
          rollout_percentage: number // 0-100 for gradual rollouts
          target_users: string[] | null // specific user IDs
          target_segments: string[] | null // user segments
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          key: string
          name: string
          description?: string | null
          flag_type: 'boolean' | 'string' | 'number' | 'json'
          default_value: any
          is_global?: boolean
          status?: 'active' | 'inactive' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
          environments?: string[]
          tags?: string[] | null
          rollout_percentage?: number
          target_users?: string[] | null
          target_segments?: string[] | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          key?: string
          name?: string
          description?: string | null
          flag_type?: 'boolean' | 'string' | 'number' | 'json'
          default_value?: any
          is_global?: boolean
          status?: 'active' | 'inactive' | 'archived'
          created_by?: string
          created_at?: string
          updated_at?: string
          environments?: string[]
          tags?: string[] | null
          rollout_percentage?: number
          target_users?: string[] | null
          target_segments?: string[] | null
        }
      }
      feature_flag_values: {
        Row: {
          id: string
          flag_id: string
          tenant_id: string | null
          environment: string
          value: any
          enabled: boolean
          rollout_percentage: number
          conditions: any | null // JSON for complex conditions
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          flag_id: string
          tenant_id?: string | null
          environment: string
          value: any
          enabled?: boolean
          rollout_percentage?: number
          conditions?: any | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          flag_id?: string
          tenant_id?: string | null
          environment?: string
          value?: any
          enabled?: boolean
          rollout_percentage?: number
          conditions?: any | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      feature_flag_dependencies: {
        Row: {
          id: string
          flag_id: string
          depends_on_flag_id: string
          dependency_type: 'requires' | 'conflicts' | 'implies'
          condition_value: any | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          flag_id: string
          depends_on_flag_id: string
          dependency_type: 'requires' | 'conflicts' | 'implies'
          condition_value?: any | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          flag_id?: string
          depends_on_flag_id?: string
          dependency_type?: 'requires' | 'conflicts' | 'implies'
          condition_value?: any | null
          created_at?: string
          created_by?: string
        }
      }
      feature_flag_evaluations: {
        Row: {
          id: string
          flag_id: string
          user_id: string
          tenant_id: string | null
          environment: string
          evaluated_value: any
          matched_conditions: any | null
          evaluation_reason: string
          created_at: string
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          flag_id: string
          user_id: string
          tenant_id?: string | null
          environment: string
          evaluated_value: any
          matched_conditions?: any | null
          evaluation_reason: string
          created_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          flag_id?: string
          user_id?: string
          tenant_id?: string | null
          environment?: string
          evaluated_value?: any
          matched_conditions?: any | null
          evaluation_reason?: string
          created_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
      }
      feature_flag_segments: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          description: string | null
          conditions: any // JSON for user segment conditions
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          description?: string | null
          conditions: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          description?: string | null
          conditions?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
    }
  }
}

// Type exports for feature flags
export type DbFeatureFlag = FeatureFlagsDatabase['public']['Tables']['feature_flags']['Row']
export type DbFeatureFlagValue = FeatureFlagsDatabase['public']['Tables']['feature_flag_values']['Row']
export type DbFeatureFlagDependency = FeatureFlagsDatabase['public']['Tables']['feature_flag_dependencies']['Row']
export type DbFeatureFlagEvaluation = FeatureFlagsDatabase['public']['Tables']['feature_flag_evaluations']['Row']
export type DbFeatureFlagSegment = FeatureFlagsDatabase['public']['Tables']['feature_flag_segments']['Row']

// Feature flag evaluation context
export interface FeatureFlagContext {
  userId?: string
  tenantId?: string
  environment: string
  userProperties?: Record<string, any>
  customProperties?: Record<string, any>
}

// Feature flag evaluation result
export interface FeatureFlagEvaluation {
  value: any
  enabled: boolean
  reason: string
  flagKey: string
  variationId?: string
}

// SQL Migration for creating feature flags tables
export const FEATURE_FLAGS_MIGRATION = `
-- Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('boolean', 'string', 'number', 'json')),
  default_value JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environments TEXT[] DEFAULT ARRAY['development', 'staging', 'production'],
  tags TEXT[],
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT[],
  target_segments TEXT[]
);

-- Unique constraint for flag keys per tenant (allow global flags)
CREATE UNIQUE INDEX idx_feature_flags_key_tenant ON feature_flags(key, COALESCE(tenant_id::text, 'global'));

-- Feature Flag Values table (environment-specific values)
CREATE TABLE IF NOT EXISTS feature_flag_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  value JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Unique constraint for flag values per environment and tenant
CREATE UNIQUE INDEX idx_feature_flag_values_unique ON feature_flag_values(flag_id, environment, COALESCE(tenant_id::text, 'global'));

-- Feature Flag Dependencies table
CREATE TABLE IF NOT EXISTS feature_flag_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  depends_on_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('requires', 'conflicts', 'implies')),
  condition_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Prevent circular dependencies
CREATE UNIQUE INDEX idx_feature_flag_dependencies_unique ON feature_flag_dependencies(flag_id, depends_on_flag_id);

-- Feature Flag Evaluations table (audit log)
CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  evaluated_value JSONB NOT NULL,
  matched_conditions JSONB,
  evaluation_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Indexes for performance
CREATE INDEX idx_feature_flag_evaluations_flag_user ON feature_flag_evaluations(flag_id, user_id, created_at DESC);
CREATE INDEX idx_feature_flag_evaluations_tenant_time ON feature_flag_evaluations(tenant_id, created_at DESC);

-- Feature Flag Segments table (user targeting)
CREATE TABLE IF NOT EXISTS feature_flag_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Unique segment names per tenant
CREATE UNIQUE INDEX idx_feature_flag_segments_name_tenant ON feature_flag_segments(name, COALESCE(tenant_id::text, 'global'));

-- RLS Policies for tenant isolation
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_segments ENABLE ROW LEVEL SECURITY;

-- Policies for feature_flags
CREATE POLICY "feature_flags_tenant_isolation" ON feature_flags
  FOR ALL USING (
    is_global = true OR 
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    tenant_id IS NULL
  );

-- Policies for feature_flag_values
CREATE POLICY "feature_flag_values_tenant_isolation" ON feature_flag_values
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM feature_flags WHERE id = flag_id AND is_global = true)
  );

-- Policies for feature_flag_dependencies
CREATE POLICY "feature_flag_dependencies_tenant_isolation" ON feature_flag_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_flags 
      WHERE id = flag_id AND (
        is_global = true OR 
        tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Policies for feature_flag_evaluations
CREATE POLICY "feature_flag_evaluations_tenant_isolation" ON feature_flag_evaluations
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Policies for feature_flag_segments
CREATE POLICY "feature_flag_segments_tenant_isolation" ON feature_flag_segments
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR
    tenant_id IS NULL
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_values_updated_at BEFORE UPDATE ON feature_flag_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_segments_updated_at BEFORE UPDATE ON feature_flag_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
