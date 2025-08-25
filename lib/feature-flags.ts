import { supabase } from './supabase'
import { getConfig } from './config'

export interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  category: string
  dependencies?: string[]
  requiresRestart?: boolean
  tenantConfigurable?: boolean
  defaultValue: boolean
}

export interface FeatureCategory {
  key: string
  name: string
  description: string
  icon?: string
}

// Feature categories
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    key: 'core',
    name: 'Core Features',
    description: 'Essential platform functionality',
    icon: 'Settings'
  },
  {
    key: 'storage',
    name: 'Storage & Files',
    description: 'File management and storage features',
    icon: 'HardDrive'
  },
  {
    key: 'collaboration',
    name: 'Collaboration',
    description: 'Team and sharing features',
    icon: 'Users'
  },
  {
    key: 'security',
    name: 'Security',
    description: 'Security and privacy features',
    icon: 'Shield'
  },
  {
    key: 'integrations',
    name: 'Integrations',
    description: 'Third-party integrations',
    icon: 'Zap'
  },
  {
    key: 'advanced',
    name: 'Advanced',
    description: 'Advanced features and customization',
    icon: 'Cpu'
  }
]

// Default feature flags
export const DEFAULT_FEATURES: FeatureFlag[] = [
  // Core Features
  {
    key: 'user_registration',
    name: 'User Registration',
    description: 'Allow new users to register accounts',
    enabled: true,
    category: 'core',
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'email_verification',
    name: 'Email Verification',
    description: 'Require email verification for new accounts',
    enabled: true,
    category: 'core',
    dependencies: ['user_registration'],
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'password_reset',
    name: 'Password Reset',
    description: 'Allow users to reset their passwords',
    enabled: true,
    category: 'core',
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'user_profiles',
    name: 'User Profiles',
    description: 'User profile management and customization',
    enabled: true,
    category: 'core',
    tenantConfigurable: true,
    defaultValue: true
  },
  
  // Storage & Files
  {
    key: 'file_upload',
    name: 'File Upload',
    description: 'Allow users to upload files',
    enabled: true,
    category: 'storage',
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'file_sharing',
    name: 'File Sharing',
    description: 'Allow users to share files publicly or with others',
    enabled: true,
    category: 'storage',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'file_versioning',
    name: 'File Versioning',
    description: 'Track file versions and history',
    enabled: true,
    category: 'storage',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'file_compression',
    name: 'File Compression',
    description: 'Automatically compress files to save storage',
    enabled: true,
    category: 'storage',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Bulk upload, download, and delete operations',
    enabled: true,
    category: 'storage',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: true
  },
  
  // Collaboration
  {
    key: 'real_time_editing',
    name: 'Real-time Editing',
    description: 'Collaborative real-time document editing',
    enabled: false,
    category: 'collaboration',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'team_workspaces',
    name: 'Team Workspaces',
    description: 'Shared workspaces for teams',
    enabled: false,
    category: 'collaboration',
    tenantConfigurable: true,
    defaultValue: false
  },
  
  // Security
  {
    key: 'virus_scanning',
    name: 'Virus Scanning',
    description: 'Scan uploaded files for malware',
    enabled: false,
    category: 'security',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'file_encryption',
    name: 'File Encryption',
    description: 'End-to-end encryption for sensitive files',
    enabled: false,
    category: 'security',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Comprehensive activity logging',
    enabled: true,
    category: 'security',
    tenantConfigurable: true,
    defaultValue: true
  },
  
  // Integrations
  {
    key: 'oauth_google',
    name: 'Google OAuth',
    description: 'Sign in with Google',
    enabled: false,
    category: 'integrations',
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'oauth_github',
    name: 'GitHub OAuth',
    description: 'Sign in with GitHub',
    enabled: false,
    category: 'integrations',
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'webhooks',
    name: 'Webhooks',
    description: 'HTTP webhooks for integrations',
    enabled: true,
    category: 'integrations',
    tenantConfigurable: true,
    defaultValue: true
  },
  {
    key: 'api_access',
    name: 'API Access',
    description: 'REST API for developers',
    enabled: true,
    category: 'integrations',
    tenantConfigurable: true,
    defaultValue: true
  },
  
  // Advanced
  {
    key: 'custom_domains',
    name: 'Custom Domains',
    description: 'Custom domain support for white-label',
    enabled: false,
    category: 'advanced',
    requiresRestart: true,
    tenantConfigurable: false,
    defaultValue: false
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed usage analytics and reporting',
    enabled: false,
    category: 'advanced',
    tenantConfigurable: true,
    defaultValue: false
  },
  {
    key: 'workflow_automation',
    name: 'Workflow Automation',
    description: 'Automated file processing workflows',
    enabled: false,
    category: 'advanced',
    dependencies: ['file_upload'],
    tenantConfigurable: true,
    defaultValue: false
  },
]

export class FeatureFlagService {
  private static cachedFlags: Map<string, boolean> = new Map()
  
  // Initialize feature flags from database
  static async initializeFlags(tenantId?: string) {
    try {
      if (!supabase) {
        // Use default values if no database
        DEFAULT_FEATURES.forEach(feature => {
          this.cachedFlags.set(feature.key, feature.defaultValue)
        })
        return
      }
      
      // Get feature flags from database
      const { data: configs } = await supabase
        .from('admin_config')
        .select('key, value')
        .eq('tenant_id', tenantId || null)
        .eq('category', 'features')
      
      // Set cached flags
      DEFAULT_FEATURES.forEach(feature => {
        const config = configs?.find(c => c.key === `feature_${feature.key}`)
        const enabled = config ? config.value : feature.defaultValue
        this.cachedFlags.set(feature.key, enabled)
      })
    } catch (error) {
      console.error('Error initializing feature flags:', error)
      // Fallback to defaults
      DEFAULT_FEATURES.forEach(feature => {
        this.cachedFlags.set(feature.key, feature.defaultValue)
      })
    }
  }
  
  // Check if a feature is enabled
  static isEnabled(featureKey: string): boolean {
    // Check cache first
    if (this.cachedFlags.has(featureKey)) {
      return this.cachedFlags.get(featureKey) || false
    }
    
    // Fallback to default if not cached
    const feature = DEFAULT_FEATURES.find(f => f.key === featureKey)
    return feature?.defaultValue || false
  }
  
  // Enable/disable a feature
  static async setFeature(featureKey: string, enabled: boolean, tenantId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }
      
      // Check if feature exists
      const feature = DEFAULT_FEATURES.find(f => f.key === featureKey)
      if (!feature) {
        return { success: false, error: 'Feature not found' }
      }
      
      // Check dependencies
      if (enabled && feature.dependencies) {
        for (const dep of feature.dependencies) {
          if (!this.isEnabled(dep)) {
            return { success: false, error: `Dependency '${dep}' must be enabled first` }
          }
        }
      }
      
      // Update database
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          tenant_id: tenantId || null,
          key: `feature_${featureKey}`,
          value: enabled,
          data_type: 'boolean',
          category: 'features',
          description: feature.description,
          editable_by_tenant: feature.tenantConfigurable || false,
          requires_restart: feature.requiresRestart || false,
        }, {
          onConflict: 'key,tenant_id'
        })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Update cache
      this.cachedFlags.set(featureKey, enabled)
      
      return { success: true }
    } catch (error) {
      console.error('Error setting feature flag:', error)
      return { success: false, error: 'Failed to update feature flag' }
    }
  }
  
  // Get all features with their status
  static async getAllFeatures(tenantId?: string): Promise<(FeatureFlag & { enabled: boolean })[]> {
    await this.initializeFlags(tenantId)
    
    return DEFAULT_FEATURES.map(feature => ({
      ...feature,
      enabled: this.isEnabled(feature.key)
    }))
  }
  
  // Get features by category
  static async getFeaturesByCategory(category: string, tenantId?: string): Promise<(FeatureFlag & { enabled: boolean })[]> {
    const allFeatures = await this.getAllFeatures(tenantId)
    return allFeatures.filter(feature => feature.category === category)
  }
  
  // Bulk update features
  static async bulkUpdateFeatures(updates: Record<string, boolean>, tenantId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      for (const [key, enabled] of Object.entries(updates)) {
        const result = await this.setFeature(key, enabled, tenantId)
        if (!result.success) {
          return result
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error bulk updating features:', error)
      return { success: false, error: 'Failed to update features' }
    }
  }
  
  // Reset features to defaults
  static async resetToDefaults(tenantId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }
      
      // Delete all feature configs for tenant
      const { error } = await supabase
        .from('admin_config')
        .delete()
        .eq('tenant_id', tenantId || null)
        .eq('category', 'features')
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Clear cache and reinitialize
      this.cachedFlags.clear()
      await this.initializeFlags(tenantId)
      
      return { success: true }
    } catch (error) {
      console.error('Error resetting features:', error)
      return { success: false, error: 'Failed to reset features' }
    }
  }
  
  // Export features configuration
  static async exportConfiguration(tenantId?: string): Promise<Record<string, boolean>> {
    const features = await this.getAllFeatures(tenantId)
    const config: Record<string, boolean> = {}
    
    features.forEach(feature => {
      config[feature.key] = feature.enabled
    })
    
    return config
  }
  
  // Import features configuration
  static async importConfiguration(config: Record<string, boolean>, tenantId?: string): Promise<{ success: boolean; error?: string }> {
    return await this.bulkUpdateFeatures(config, tenantId)
  }
}

export default FeatureFlagService
