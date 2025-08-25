// Legacy file - Use lib/supabase-client.ts for new implementations
// This file is kept for backward compatibility

import {
  getSupabase,
  getSupabaseAdmin,
  isSupabaseConfigured as _isSupabaseConfigured,
  getCurrentUser as _getCurrentUser
} from './supabase-client'

// Legacy exports
export const supabase = getSupabase()
export const supabaseAdmin = getSupabaseAdmin()
export const isSupabaseConfigured = _isSupabaseConfigured
export const getCurrentUser = _getCurrentUser

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          company: string | null
          email_verified: boolean
          created_at: string
          updated_at: string
          last_login: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_expires: string | null
          storage_quota: number | null
          file_count_limit: number | null
          tenant_id: string | null
          role: string | null
          timezone: string | null
          language: string | null
          theme: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          company?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_expires?: string | null
          storage_quota?: number | null
          file_count_limit?: number | null
          tenant_id?: string | null
          role?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          company?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_expires?: string | null
          storage_quota?: number | null
          file_count_limit?: number | null
          tenant_id?: string | null
          role?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          name: string
          original_name: string
          path: string
          size: number | null
          mime_type: string | null
          file_type: string | null
          extension: string | null
          storage_provider: string | null
          storage_path: string | null
          cdn_url: string | null
          processing_status: string | null
          compression_status: string | null
          virus_scan_status: string | null
          created_at: string
          updated_at: string
          last_accessed: string | null
          is_public: boolean
          share_token: string | null
          expires_at: string | null
          folder_id: string | null
          project_id: string | null
          tags: string[] | null
          version_number: number | null
          parent_version_id: string | null
          is_deleted: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          original_name: string
          path: string
          size?: number | null
          mime_type?: string | null
          file_type?: string | null
          extension?: string | null
          storage_provider?: string | null
          storage_path?: string | null
          cdn_url?: string | null
          processing_status?: string | null
          compression_status?: string | null
          virus_scan_status?: string | null
          created_at?: string
          updated_at?: string
          last_accessed?: string | null
          is_public?: boolean
          share_token?: string | null
          expires_at?: string | null
          folder_id?: string | null
          project_id?: string | null
          tags?: string[] | null
          version_number?: number | null
          parent_version_id?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          original_name?: string
          path?: string
          size?: number | null
          mime_type?: string | null
          file_type?: string | null
          extension?: string | null
          storage_provider?: string | null
          storage_path?: string | null
          cdn_url?: string | null
          processing_status?: string | null
          compression_status?: string | null
          virus_scan_status?: string | null
          created_at?: string
          updated_at?: string
          last_accessed?: string | null
          is_public?: boolean
          share_token?: string | null
          expires_at?: string | null
          folder_id?: string | null
          project_id?: string | null
          tags?: string[] | null
          version_number?: number | null
          parent_version_id?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
        }
      }
      tenants: {
        Row: {
          id: string
          name: string | null
          slug: string | null
          logo_url: string | null
          brand_color: string | null
          secondary_color: string | null
          font_family: string | null
          custom_domain: string | null
          ssl_enabled: boolean
          enabled_features: string[] | null
          storage_quota: number | null
          user_limit: number | null
          plan: string | null
          billing_email: string | null
          default_language: string | null
          timezone: string | null
          email_from_name: string | null
          email_from_address: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_username: string | null
          smtp_password: string | null
          smtp_secure: boolean
          google_oauth_enabled: boolean
          github_oauth_enabled: boolean
          saml_enabled: boolean
          saml_config: any | null
          created_at: string
          updated_at: string
          status: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          slug?: string | null
          logo_url?: string | null
          brand_color?: string | null
          secondary_color?: string | null
          font_family?: string | null
          custom_domain?: string | null
          ssl_enabled?: boolean
          enabled_features?: string[] | null
          storage_quota?: number | null
          user_limit?: number | null
          plan?: string | null
          billing_email?: string | null
          default_language?: string | null
          timezone?: string | null
          email_from_name?: string | null
          email_from_address?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          smtp_password?: string | null
          smtp_secure?: boolean
          google_oauth_enabled?: boolean
          github_oauth_enabled?: boolean
          saml_enabled?: boolean
          saml_config?: any | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          slug?: string | null
          logo_url?: string | null
          brand_color?: string | null
          secondary_color?: string | null
          font_family?: string | null
          custom_domain?: string | null
          ssl_enabled?: boolean
          enabled_features?: string[] | null
          storage_quota?: number | null
          user_limit?: number | null
          plan?: string | null
          billing_email?: string | null
          default_language?: string | null
          timezone?: string | null
          email_from_name?: string | null
          email_from_address?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          smtp_password?: string | null
          smtp_secure?: boolean
          google_oauth_enabled?: boolean
          github_oauth_enabled?: boolean
          saml_enabled?: boolean
          saml_config?: any | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
      }
      admin_config: {
        Row: {
          id: string
          tenant_id: string | null
          key: string
          value: any | null
          data_type: string
          description: string | null
          category: string | null
          is_sensitive: boolean
          validation_rules: any | null
          default_value: any | null
          created_at: string
          updated_at: string
          editable_by_tenant: boolean
          requires_restart: boolean
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          key: string
          value?: any | null
          data_type: string
          description?: string | null
          category?: string | null
          is_sensitive?: boolean
          validation_rules?: any | null
          default_value?: any | null
          created_at?: string
          updated_at?: string
          editable_by_tenant?: boolean
          requires_restart?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string | null
          key?: string
          value?: any | null
          data_type?: string
          description?: string | null
          category?: string | null
          is_sensitive?: boolean
          validation_rules?: any | null
          default_value?: any | null
          created_at?: string
          updated_at?: string
          editable_by_tenant?: boolean
          requires_restart?: boolean
        }
      }
    }
  }
}

export type DbUser = Database['public']['Tables']['users']['Row']
export type DbFile = Database['public']['Tables']['files']['Row']
export type DbTenant = Database['public']['Tables']['tenants']['Row']
export type DbAdminConfig = Database['public']['Tables']['admin_config']['Row']
