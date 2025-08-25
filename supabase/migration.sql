-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'trialing', 'past_due');
CREATE TYPE file_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE share_permission AS ENUM ('view', 'download', 'comment', 'edit');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE webhook_event AS ENUM ('file.created', 'file.updated', 'file.deleted', 'user.created', 'share.created');

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    slug TEXT UNIQUE,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#6366f1',
    secondary_color TEXT DEFAULT '#e2e8f0',
    font_family TEXT DEFAULT 'Inter',
    custom_domain TEXT,
    ssl_enabled BOOLEAN DEFAULT false,
    enabled_features TEXT[] DEFAULT '{}',
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB
    user_limit INTEGER DEFAULT 100,
    plan TEXT DEFAULT 'free',
    billing_email TEXT,
    default_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    email_from_name TEXT DEFAULT 'Tanuki Storage',
    email_from_address TEXT DEFAULT 'noreply@tanuki.dev',
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_username TEXT,
    smtp_password TEXT,
    smtp_secure BOOLEAN DEFAULT true,
    google_oauth_enabled BOOLEAN DEFAULT false,
    github_oauth_enabled BOOLEAN DEFAULT false,
    saml_enabled BOOLEAN DEFAULT false,
    saml_config JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    email_verified BOOLEAN DEFAULT false,
    role user_role DEFAULT 'user',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_plan TEXT DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_expires TIMESTAMP WITH TIME ZONE,
    storage_quota BIGINT DEFAULT 1073741824, -- 1GB
    file_count_limit INTEGER DEFAULT 1000,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'system',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADMIN CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    data_type TEXT NOT NULL DEFAULT 'string',
    description TEXT,
    category TEXT DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT false,
    validation_rules JSONB,
    default_value JSONB,
    editable_by_tenant BOOLEAN DEFAULT true,
    requires_restart BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key, tenant_id)
);

-- ============================================================================
-- FOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    color TEXT,
    is_shared BOOLEAN DEFAULT false,
    share_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    project_id UUID,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT,
    mime_type TEXT,
    file_type TEXT,
    extension TEXT,
    storage_provider TEXT DEFAULT 'supabase',
    storage_path TEXT,
    cdn_url TEXT,
    processing_status file_processing_status DEFAULT 'completed',
    compression_status TEXT DEFAULT 'none',
    virus_scan_status TEXT DEFAULT 'pending',
    checksum TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    version_number INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES files(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    share_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FILE VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    size BIGINT NOT NULL,
    checksum TEXT NOT NULL,
    comment TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, version_number)
);

-- ============================================================================
-- SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    permissions share_permission[] DEFAULT '{view,download}',
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- FEATURE FLAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    flag_key TEXT NOT NULL,
    flag_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    target_percentage INTEGER DEFAULT 100,
    target_users TEXT[] DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flag_key, tenant_id)
);

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events webhook_event[] NOT NULL,
    secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    headers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type webhook_event NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    attempt_count INTEGER DEFAULT 1,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    storage_used BIGINT DEFAULT 0,
    bandwidth_used BIGINT DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    files_downloaded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, date)
);

-- ============================================================================
-- COLLABORATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions share_permission[] DEFAULT '{view}',
    status TEXT DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(file_id, user_id)
);

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position JSONB, -- For positioned comments (x, y coordinates, page number, etc.)
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEARCH INDEX TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    content TEXT,
    content_vector tsvector,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BACKUP CONFIGURATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS backup_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL, -- Cron expression
    retention_days INTEGER DEFAULT 30,
    include_patterns TEXT[] DEFAULT '{}',
    exclude_patterns TEXT[] DEFAULT '{}',
    storage_provider TEXT DEFAULT 'supabase',
    storage_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    next_backup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BACKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES backup_configs(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    backup_name TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    storage_path TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token);

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);

-- Shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_file_id ON shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);

-- File versions indexes
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at);

-- Search index
CREATE INDEX IF NOT EXISTS idx_search_content_vector ON search_index USING gin(content_vector);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant_date ON usage_tracking(tenant_id, date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ language 'plpgsql';

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO search_index (file_id, content, content_vector)
        VALUES (NEW.id, NEW.name || ' ' || COALESCE(NEW.original_name, ''), to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.original_name, '')))
        ON CONFLICT (file_id) 
        DO UPDATE SET 
            content = EXCLUDED.content,
            content_vector = EXCLUDED.content_vector,
            indexed_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM search_index WHERE file_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER trigger_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_admin_config_updated_at BEFORE UPDATE ON admin_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_shares_updated_at BEFORE UPDATE ON shares FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trigger_backup_configs_updated_at BEFORE UPDATE ON backup_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Search index triggers
CREATE TRIGGER trigger_files_search_index 
    AFTER INSERT OR UPDATE OR DELETE ON files 
    FOR EACH ROW EXECUTE PROCEDURE update_search_index();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Tenants are viewable by members" ON tenants FOR SELECT USING (
    id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Only admins can modify tenants" ON tenants FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all users in their tenant" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users admin_user 
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
        AND (admin_user.tenant_id = users.tenant_id OR admin_user.tenant_id IS NULL)
    )
);

CREATE POLICY "Admins can modify users in their tenant" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users admin_user 
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
        AND (admin_user.tenant_id = users.tenant_id OR admin_user.tenant_id IS NULL)
    )
);

-- Admin config policies
CREATE POLICY "Admins can view all admin configs" ON admin_config FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can modify admin configs" ON admin_config FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Files policies
CREATE POLICY "Users can view their own files" ON files FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view shared files" ON files FOR SELECT USING (
    id IN (
        SELECT file_id FROM shares 
        WHERE (shared_with_user_id = auth.uid() OR is_active = true)
        AND (expires_at IS NULL OR expires_at > NOW())
    )
);

CREATE POLICY "Users can view public files" ON files FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own files" ON files FOR ALL USING (user_id = auth.uid());

-- Folders policies
CREATE POLICY "Users can view their own folders" ON folders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (user_id = auth.uid());

-- File versions policies
CREATE POLICY "Users can view versions of their files" ON file_versions FOR SELECT USING (
    file_id IN (SELECT id FROM files WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage versions of their files" ON file_versions FOR ALL USING (
    file_id IN (SELECT id FROM files WHERE user_id = auth.uid())
);

-- Shares policies
CREATE POLICY "Users can view shares they created" ON shares FOR SELECT USING (shared_by = auth.uid());

CREATE POLICY "Users can view shares targeted to them" ON shares FOR SELECT USING (shared_with_user_id = auth.uid());

CREATE POLICY "Users can manage shares they created" ON shares FOR ALL USING (shared_by = auth.uid());

-- Activity logs policies
CREATE POLICY "Users can view their own activity" ON activity_logs FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity in their tenant" ON activity_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users admin_user, users log_user
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
        AND log_user.id = activity_logs.user_id
        AND (admin_user.tenant_id = log_user.tenant_id OR admin_user.tenant_id IS NULL)
    )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Feature flags policies
CREATE POLICY "Users can view feature flags for their tenant" ON feature_flags FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage feature flags" ON feature_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Webhooks policies
CREATE POLICY "Admins can manage webhooks" ON webhooks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Comments policies
CREATE POLICY "Users can view comments on files they have access to" ON comments FOR SELECT USING (
    file_id IN (
        SELECT id FROM files 
        WHERE user_id = auth.uid() 
        OR is_public = true
        OR id IN (SELECT file_id FROM shares WHERE shared_with_user_id = auth.uid())
    )
);

CREATE POLICY "Users can manage their own comments" ON comments FOR ALL USING (user_id = auth.uid());

-- Usage tracking policies
CREATE POLICY "Users can view their own usage" ON usage_tracking FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view usage for their tenant" ON usage_tracking FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users admin_user, users tracked_user
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
        AND tracked_user.id = usage_tracking.user_id
        AND (admin_user.tenant_id = tracked_user.tenant_id OR admin_user.tenant_id IS NULL)
    )
);

-- Search index policies
CREATE POLICY "Users can view search index for accessible files" ON search_index FOR SELECT USING (
    file_id IN (
        SELECT id FROM files 
        WHERE user_id = auth.uid() 
        OR is_public = true
        OR id IN (SELECT file_id FROM shares WHERE shared_with_user_id = auth.uid())
    )
);

-- Backup policies
CREATE POLICY "Admins can manage backups" ON backup_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view backups" ON backups FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default tenant
INSERT INTO tenants (id, name, slug, plan, status) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Tenant', 'default', 'enterprise', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (will be updated with real auth data)
INSERT INTO users (id, email, full_name, role, tenant_id, email_verified) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@tanuki.dev', 'System Administrator', 'admin', '00000000-0000-0000-0000-000000000000', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE BUCKET SETUP (for Supabase Storage)
-- ============================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('files', 'files', false),
    ('avatars', 'avatars', true),
    ('thumbnails', 'thumbnails', true),
    ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for files bucket
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for public buckets
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

-- Backup storage policies
CREATE POLICY "Admins can manage backups" ON storage.objects FOR ALL USING (
    bucket_id = 'backups' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
