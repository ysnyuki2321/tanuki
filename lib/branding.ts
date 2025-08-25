import { getSupabase } from './supabase-client'
import { getConfig } from './config'

export interface BrandingConfig {
  // Visual branding
  logo_url: string | null
  logo_dark_url: string | null
  favicon_url: string | null
  
  // Colors
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  
  // Typography
  font_family: string
  heading_font: string
  
  // Company info
  company_name: string
  company_description: string
  company_website: string | null
  support_email: string | null
  
  // Custom CSS
  custom_css: string | null
  
  // Footer
  footer_text: string | null
  copyright_text: string
  
  // Social links
  social_links: {
    twitter?: string
    facebook?: string
    linkedin?: string
    github?: string
    discord?: string
  }
  
  // Advanced
  enable_custom_domain: boolean
  custom_domain: string | null
  ssl_enabled: boolean
}

const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#06b6d4',
  background_color: '#ffffff',
  text_color: '#1f2937',
  font_family: 'Inter, system-ui, sans-serif',
  heading_font: 'Inter, system-ui, sans-serif',
  company_name: 'Tanuki Storage',
  company_description: 'Smart Web Storage Platform',
  company_website: null,
  support_email: null,
  custom_css: null,
  footer_text: null,
  copyright_text: '© 2024 Tanuki Storage. All rights reserved.',
  social_links: {},
  enable_custom_domain: false,
  custom_domain: null,
  ssl_enabled: false,
}

export class BrandingService {
  private static cachedBranding: BrandingConfig | null = null
  
  // Get current branding configuration
  static async getBranding(tenantId?: string): Promise<BrandingConfig> {
    // Return cached if available and no tenant specified
    if (!tenantId && this.cachedBranding) {
      return this.cachedBranding
    }
    
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return DEFAULT_BRANDING
      }
      
      // Get branding config from database
      const { data: configs } = await supabase
        .from('admin_config')
        .select('key, value')
        .eq('tenant_id', tenantId || null)
        .in('key', [
          'logo_url', 'logo_dark_url', 'favicon_url',
          'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color',
          'font_family', 'heading_font',
          'company_name', 'company_description', 'company_website', 'support_email',
          'custom_css', 'footer_text', 'copyright_text', 'social_links',
          'enable_custom_domain', 'custom_domain', 'ssl_enabled'
        ])
      
      // Build branding config from database values
      const branding = { ...DEFAULT_BRANDING }
      
      configs?.forEach(config => {
        if (config.value !== null) {
          (branding as any)[config.key] = config.value
        }
      })
      
      // Cache if no tenant specified (global)
      if (!tenantId) {
        this.cachedBranding = branding
      }
      
      return branding
    } catch (error) {
      console.error('Error loading branding:', error)
      return DEFAULT_BRANDING
    }
  }
  
  // Update branding configuration
  static async updateBranding(updates: Partial<BrandingConfig>, tenantId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }
      
      // Convert updates to config entries
      const configUpdates = Object.entries(updates).map(([key, value]) => ({
        tenant_id: tenantId || null,
        key,
        value,
        data_type: typeof value === 'object' ? 'json' : typeof value,
        category: 'branding',
        editable_by_tenant: true,
      }))
      
      // Upsert config entries
      const { error } = await supabase
        .from('admin_config')
        .upsert(configUpdates, {
          onConflict: 'key,tenant_id'
        })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Clear cache
      this.cachedBranding = null
      
      // Apply branding to current page
      await this.applyBranding()
      
      return { success: true }
    } catch (error) {
      console.error('Error updating branding:', error)
      return { success: false, error: 'Failed to update branding' }
    }
  }
  
  // Apply branding to current page
  static async applyBranding(tenantId?: string) {
    try {
      // Check if we're in browser environment
      if (typeof document === 'undefined') {
        return // Skip on server-side rendering
      }

      const branding = await this.getBranding(tenantId)

      // Update CSS variables
      const root = document.documentElement
    root.style.setProperty('--primary-color', branding.primary_color)
    root.style.setProperty('--secondary-color', branding.secondary_color)
    root.style.setProperty('--accent-color', branding.accent_color)
    root.style.setProperty('--background-color', branding.background_color)
    root.style.setProperty('--text-color', branding.text_color)
    root.style.setProperty('--font-family', branding.font_family)
    root.style.setProperty('--heading-font', branding.heading_font)
    
    // Update document title
    if (branding.company_name && typeof document !== 'undefined') {
      document.title = branding.company_name
    }
    
    // Update favicon
    if (branding.favicon_url && typeof document !== 'undefined') {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) {
        favicon.href = branding.favicon_url
      } else {
        const newFavicon = document.createElement('link')
        newFavicon.rel = 'icon'
        newFavicon.href = branding.favicon_url
        document.head.appendChild(newFavicon)
      }
    }
    
    // Apply custom CSS
    if (branding.custom_css && typeof document !== 'undefined') {
      let customStyle = document.getElementById('custom-branding-css')
      if (!customStyle) {
        customStyle = document.createElement('style')
        customStyle.id = 'custom-branding-css'
        document.head.appendChild(customStyle)
      }
      customStyle.textContent = branding.custom_css
    }
    } catch (error) {
      console.warn('Error applying branding:', error)
      // Gracefully degrade - app continues to work without branding
    }
  }
  
  // Generate CSS variables for branding
  static generateCSSVariables(branding: BrandingConfig): string {
    return `
      :root {
        --primary-color: ${branding.primary_color};
        --secondary-color: ${branding.secondary_color};
        --accent-color: ${branding.accent_color};
        --background-color: ${branding.background_color};
        --text-color: ${branding.text_color};
        --font-family: ${branding.font_family};
        --heading-font: ${branding.heading_font};
      }
      
      .brand-primary { color: var(--primary-color); }
      .brand-secondary { color: var(--secondary-color); }
      .brand-accent { color: var(--accent-color); }
      
      .bg-brand-primary { background-color: var(--primary-color); }
      .bg-brand-secondary { background-color: var(--secondary-color); }
      .bg-brand-accent { background-color: var(--accent-color); }
      
      .border-brand-primary { border-color: var(--primary-color); }
      .border-brand-secondary { border-color: var(--secondary-color); }
      .border-brand-accent { border-color: var(--accent-color); }
      
      body {
        font-family: var(--font-family);
        color: var(--text-color);
        background-color: var(--background-color);
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--heading-font);
      }
      
      ${branding.custom_css || ''}
    `
  }
  
  // Get logo URL based on theme
  static getLogoUrl(branding: BrandingConfig, isDark: boolean = false): string | null {
    if (isDark && branding.logo_dark_url) {
      return branding.logo_dark_url
    }
    return branding.logo_url
  }
  
  // Upload logo file
  static async uploadLogo(file: File, type: 'logo' | 'logo_dark' | 'favicon', tenantId?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }
      
      // Generate file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = tenantId ? `branding/${tenantId}/${fileName}` : `branding/global/${fileName}`
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })
      
      if (uploadError) {
        return { success: false, error: uploadError.message }
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)
      
      // Update branding config
      const configKey = type === 'logo' ? 'logo_url' : type === 'logo_dark' ? 'logo_dark_url' : 'favicon_url'
      await this.updateBranding({ [configKey]: publicUrl }, tenantId)
      
      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading logo:', error)
      return { success: false, error: 'Failed to upload logo' }
    }
  }
  
  // Reset branding to defaults
  static async resetBranding(tenantId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' }
      }
      
      // Delete all branding configs for tenant
      const { error } = await supabase
        .from('admin_config')
        .delete()
        .eq('tenant_id', tenantId || null)
        .eq('category', 'branding')
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      // Clear cache
      this.cachedBranding = null
      
      // Apply default branding
      await this.applyBranding()
      
      return { success: true }
    } catch (error) {
      console.error('Error resetting branding:', error)
      return { success: false, error: 'Failed to reset branding' }
    }
  }
  
  // Export branding config as JSON
  static async exportBranding(tenantId?: string): Promise<BrandingConfig> {
    return await this.getBranding(tenantId)
  }
  
  // Import branding config from JSON
  static async importBranding(brandingConfig: Partial<BrandingConfig>, tenantId?: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateBranding(brandingConfig, tenantId)
  }
}

export default BrandingService
