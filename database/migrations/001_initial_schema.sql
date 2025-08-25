-- Database Migration: Initial Schema for Tanuki Platform
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE file_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE storage_provider AS ENUM ('supabase', 's3', 'gcs');

-- Tenants table for multi-tenant architecture
CREATE TABLE tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE,
    logo_url TEXT,
    brand_color TEXT,
    secondary_color TEXT,
    font_family TEXT,
    custom_domain TEXT UNIQUE,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    enabled_features TEXT[],
    storage_quota BIGINT,
    user_limit INTEGER,
    plan TEXT,
    billing_email TEXT,
    default_language TEXT,
    timezone TEXT,
    email_from_name TEXT,
    email_from_address TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_username TEXT,
    smtp_password TEXT,
    smtp_secure BOOLEAN DEFAULT FALSE,
    google_oauth_enabled BOOLEAN DEFAULT FALSE,
    github_oauth_enabled BOOLEAN DEFAULT FALSE,
    saml_enabled BOOLEAN DEFAULT FALSE,
    saml_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status tenant_status DEFAULT 'active'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    subscription_plan TEXT,
    subscription_status subscription_status,
    subscription_expires TIMESTAMP WITH TIME ZONE,
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB default
    file_count_limit INTEGER DEFAULT 1000,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    role user_role DEFAULT 'user',
    timezone TEXT,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    
    -- Indexes
    UNIQUE(email, tenant_id)
);

-- Admin configuration table
CREATE TABLE admin_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    data_type TEXT NOT NULL DEFAULT 'string',
    description TEXT,
    category TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    validation_rules JSONB,
    default_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    editable_by_tenant BOOLEAN DEFAULT TRUE,
    requires_restart BOOLEAN DEFAULT FALSE,
    
    -- Ensure unique keys per tenant (null tenant_id means global)
    UNIQUE(key, tenant_id)
);

-- Folders table for file organization
CREATE TABLE folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent circular references
    CHECK (parent_id != id)
);

-- Projects table for workspace organization
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_shared BOOLEAN DEFAULT FALSE,
    share_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- File info
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT,
    mime_type TEXT,
    file_type TEXT,
    extension TEXT,
    
    -- Storage info
    storage_provider storage_provider DEFAULT 'supabase',
    storage_path TEXT,
    cdn_url TEXT,
    
    -- Processing status
    processing_status file_processing_status DEFAULT 'completed',
    compression_status file_processing_status,
    virus_scan_status file_processing_status,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Organization
    tags TEXT[],
    
    -- Versioning
    version_number INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES files(id) ON DELETE SET NULL,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- File versions table for detailed version tracking
CREATE TABLE file_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    size BIGINT,
    storage_path TEXT,
    checksum TEXT,
    changes_description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(file_id, version_number)
);

-- Shares table for file sharing management
CREATE TABLE shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    shared_with_email TEXT,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
    permissions TEXT[] DEFAULT ARRAY['read'],
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure at least one resource is shared
    CHECK (
        (file_id IS NOT NULL)::integer + 
        (folder_id IS NOT NULL)::integer + 
        (project_id IS NOT NULL)::integer = 1
    )
);

-- Collaborations table for real-time editing
CREATE TABLE collaborations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read'],
    cursor_position JSONB,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(file_id, user_id, session_id)
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks table for integrations
CREATE TABLE webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT,
    active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_tenant_id ON files(tenant_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_share_token ON files(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_files_is_deleted ON files(is_deleted);
CREATE INDEX idx_files_created_at ON files(created_at);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders(path);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shares_updated_at BEFORE UPDATE ON shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can access their own data)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own files" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own files" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own files" ON files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own files" ON files FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Shared files policies
CREATE POLICY "Public files are viewable" ON files FOR SELECT USING (is_public = true);
CREATE POLICY "Shared files are viewable" ON files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shares 
        WHERE shares.file_id = files.id 
        AND (shares.expires_at IS NULL OR shares.expires_at > NOW())
    )
);

-- Admin policies (will be refined based on user roles)
CREATE POLICY "Admins can view all data" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
    )
);

-- Insert default admin config values
INSERT INTO admin_config (tenant_id, key, value, data_type, description, category, is_sensitive, editable_by_tenant) VALUES
(NULL, 'app_name', '"Tanuki Storage"', 'string', 'Application name', 'branding', false, true),
(NULL, 'app_description', '"Smart Web Storage Platform"', 'string', 'Application description', 'branding', false, true),
(NULL, 'enable_registration', 'true', 'boolean', 'Allow new user registration', 'features', false, true),
(NULL, 'enable_email_verification', 'true', 'boolean', 'Require email verification', 'features', false, true),
(NULL, 'enable_file_sharing', 'true', 'boolean', 'Allow file sharing', 'features', false, true),
(NULL, 'enable_collaboration', 'true', 'boolean', 'Enable real-time collaboration', 'features', false, true),
(NULL, 'enable_virus_scan', 'false', 'boolean', 'Enable virus scanning', 'security', false, true),
(NULL, 'enable_compression', 'true', 'boolean', 'Enable file compression', 'features', false, true),
(NULL, 'default_storage_quota', '1073741824', 'number', 'Default storage quota in bytes (1GB)', 'limits', false, true),
(NULL, 'default_file_limit', '1000', 'number', 'Default file count limit', 'limits', false, true),
(NULL, 'max_file_size', '104857600', 'number', 'Maximum file size in bytes (100MB)', 'limits', false, true),
(NULL, 'max_upload_concurrent', '5', 'number', 'Maximum concurrent uploads', 'limits', false, true)
ON CONFLICT (key, tenant_id) DO NOTHING;

-- Create a default tenant for single-tenant mode
INSERT INTO tenants (id, name, slug, status) VALUES 
(uuid_generate_v4(), 'Default', 'default', 'active')
ON CONFLICT DO NOTHING;
