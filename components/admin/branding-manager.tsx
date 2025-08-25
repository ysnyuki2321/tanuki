"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RefreshCw, 
  RotateCcw,
  Image as ImageIcon,
  Type,
  Globe,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  MessageCircle,
  ExternalLink,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react'
import { BrandingService, type BrandingConfig } from '@/lib/branding'
import { RealAdminAuthService } from '@/lib/real-admin-auth'
import { toast } from 'sonner'

interface BrandingManagerProps {
  tenantId?: string
}

export function BrandingManager({ tenantId }: BrandingManagerProps) {
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [originalConfig, setOriginalConfig] = useState<BrandingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Load branding configuration
  useEffect(() => {
    loadBrandingConfig()
  }, [tenantId])

  // Check for changes
  useEffect(() => {
    if (config && originalConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)
      setHasChanges(hasChanges)
    }
  }, [config, originalConfig])

  const loadBrandingConfig = async () => {
    setIsLoading(true)
    try {
      const brandingConfig = await BrandingService.getBranding(tenantId)
      setConfig(brandingConfig)
      setOriginalConfig({ ...brandingConfig })
    } catch (error) {
      console.error('Failed to load branding config:', error)
      toast.error('Failed to load branding configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof BrandingConfig, value: any) => {
    if (!config) return
    
    setConfig(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    if (!config) return

    setConfig(prev => ({
      ...prev!,
      social_links: {
        ...prev!.social_links,
        [platform]: url
      }
    }))
  }

  const handleLogoUpload = async (type: 'logo' | 'logo_dark' | 'favicon', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be less than 2MB')
      return
    }

    try {
      const result = await BrandingService.uploadLogo(file, type, tenantId)
      if (result.success && result.url) {
        handleInputChange(
          type === 'logo' ? 'logo_url' : type === 'logo_dark' ? 'logo_dark_url' : 'favicon_url',
          result.url
        )
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`)
      } else {
        toast.error(result.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    }
  }

  const saveChanges = async () => {
    if (!config || !RealAdminAuthService.hasAdminPermission('config.edit')) {
      toast.error('Insufficient permissions')
      return
    }

    setIsSaving(true)
    try {
      const result = await BrandingService.updateBranding(config, tenantId)
      if (result.success) {
        setOriginalConfig({ ...config })
        toast.success('Branding updated successfully')
        
        // Log admin action
        RealAdminAuthService.logAdminAction('branding.updated', { 
          tenantId: tenantId || 'global'
        })

        // Apply branding immediately
        await BrandingService.applyBranding(tenantId)
      } else {
        toast.error(result.error || 'Failed to update branding')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const resetChanges = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig })
      toast.info('Changes reverted')
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset branding to defaults?')) {
      return
    }

    try {
      const result = await BrandingService.resetBranding(tenantId)
      if (result.success) {
        await loadBrandingConfig()
        toast.success('Branding reset to defaults')
        
        RealAdminAuthService.logAdminAction('branding.reset', { 
          tenantId: tenantId || 'global' 
        })
      } else {
        toast.error(result.error || 'Failed to reset branding')
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset branding')
    }
  }

  const previewBranding = async () => {
    if (!config) return

    try {
      // Apply branding temporarily for preview
      await BrandingService.applyBranding(tenantId)
      setPreviewMode(true)
      toast.success('Preview mode activated')
      
      // Auto-disable preview after 10 seconds
      setTimeout(() => {
        setPreviewMode(false)
        toast.info('Preview mode disabled')
      }, 10000)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to activate preview')
    }
  }

  if (isLoading || !config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading branding configuration...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding & Appearance</h2>
          <p className="text-muted-foreground">
            Customize the look and feel of your platform {tenantId ? 'for this tenant' : 'globally'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadBrandingConfig()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={previewBranding}
            disabled={!hasChanges}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          {hasChanges && (
            <>
              <Button
                variant="outline"
                onClick={resetChanges}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revert
              </Button>
              
              <Button
                onClick={saveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          )}

          <Button
            variant="destructive"
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your branding configuration.
          </AlertDescription>
        </Alert>
      )}

      {previewMode && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Preview mode is active. Changes are temporarily applied to see how they look.
          </AlertDescription>
        </Alert>
      )}

      {/* Branding Configuration */}
      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Visual Tab */}
        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Visual Assets
              </CardTitle>
              <CardDescription>
                Upload logos, favicons, and other visual elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Primary Logo</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {config.logo_url ? (
                      <div className="space-y-2">
                        <img 
                          src={config.logo_url} 
                          alt="Logo" 
                          className="max-h-16 mx-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => handleLogoUpload('logo', e as any)
                            input.click()
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => handleLogoUpload('logo', e as any)
                            input.click()
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Dark Mode Logo</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-gray-900">
                    {config.logo_dark_url ? (
                      <div className="space-y-2">
                        <img 
                          src={config.logo_dark_url} 
                          alt="Dark Logo" 
                          className="max-h-16 mx-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => handleLogoUpload('logo_dark', e as any)
                            input.click()
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-white" />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => handleLogoUpload('logo_dark', e as any)
                            input.click()
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Dark Logo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-4">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  {config.favicon_url && (
                    <img 
                      src={config.favicon_url} 
                      alt="Favicon" 
                      className="w-8 h-8"
                    />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => handleLogoUpload('favicon', e as any)
                      input.click()
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {config.favicon_url ? 'Replace' : 'Upload'} Favicon
                  </Button>
                </div>
              </div>

              {/* Custom CSS */}
              <div className="space-y-4">
                <Label>Custom CSS</Label>
                <Textarea
                  placeholder="Add your custom CSS here..."
                  value={config.custom_css || ''}
                  onChange={(e) => handleInputChange('custom_css', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Customize the color palette of your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        type="text"
                        value={config.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        type="text"
                        value={config.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        type="text"
                        value={config.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        placeholder="#06b6d4"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        type="text"
                        value={config.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.text_color}
                        onChange={(e) => handleInputChange('text_color', e.target.value)}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        type="text"
                        value={config.text_color}
                        onChange={(e) => handleInputChange('text_color', e.target.value)}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <Label>Color Preview</Label>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div 
                      className="w-full h-12 rounded-md border"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">Primary</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-12 rounded-md border"
                      style={{ backgroundColor: config.secondary_color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">Secondary</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-12 rounded-md border"
                      style={{ backgroundColor: config.accent_color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">Accent</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-12 rounded-md border"
                      style={{ backgroundColor: config.background_color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">Background</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-12 rounded-md border"
                      style={{ backgroundColor: config.text_color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">Text</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Customize fonts and typography settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Body Font Family</Label>
                  <Input
                    type="text"
                    value={config.font_family}
                    onChange={(e) => handleInputChange('font_family', e.target.value)}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heading Font Family</Label>
                  <Input
                    type="text"
                    value={config.heading_font}
                    onChange={(e) => handleInputChange('heading_font', e.target.value)}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>
              </div>

              {/* Typography Preview */}
              <Separator />
              <div className="space-y-4">
                <Label>Typography Preview</Label>
                <div 
                  className="p-4 border rounded-lg"
                  style={{ 
                    fontFamily: config.font_family,
                    color: config.text_color 
                  }}
                >
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ fontFamily: config.heading_font }}
                  >
                    Heading 1
                  </h1>
                  <h2 
                    className="text-2xl font-semibold mb-2"
                    style={{ fontFamily: config.heading_font }}
                  >
                    Heading 2
                  </h2>
                  <p className="text-base mb-2">
                    This is a paragraph of body text that demonstrates how your chosen fonts will look in the application.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is smaller text that might be used for captions or secondary information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Set up your company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      type="text"
                      value={config.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company Website</Label>
                    <Input
                      type="url"
                      value={config.company_website || ''}
                      onChange={(e) => handleInputChange('company_website', e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={config.support_email || ''}
                      onChange={(e) => handleInputChange('support_email', e.target.value)}
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Description</Label>
                    <Textarea
                      value={config.company_description}
                      onChange={(e) => handleInputChange('company_description', e.target.value)}
                      placeholder="Brief description of your company..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Input
                      type="text"
                      value={config.footer_text || ''}
                      onChange={(e) => handleInputChange('footer_text', e.target.value)}
                      placeholder="Additional footer information"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Copyright Text</Label>
                    <Input
                      type="text"
                      value={config.copyright_text}
                      onChange={(e) => handleInputChange('copyright_text', e.target.value)}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="w-5 h-5" />
                Social Links
              </CardTitle>
              <CardDescription>
                Add social media links for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Label>
                    <Input
                      type="url"
                      value={config.social_links.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/yourcompany"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Label>
                    <Input
                      type="url"
                      value={config.social_links.facebook || ''}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourcompany"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Label>
                    <Input
                      type="url"
                      value={config.social_links.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub
                    </Label>
                    <Input
                      type="url"
                      value={config.social_links.github || ''}
                      onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                      placeholder="https://github.com/yourcompany"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Discord
                    </Label>
                    <Input
                      type="url"
                      value={config.social_links.discord || ''}
                      onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                      placeholder="https://discord.gg/yourserver"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links Preview */}
              <Separator />
              <div className="space-y-4">
                <Label>Social Links Preview</Label>
                <div className="flex items-center gap-4 flex-wrap">
                  {Object.entries(config.social_links).map(([platform, url]) => {
                    if (!url) return null

                    const icons = {
                      twitter: Twitter,
                      facebook: Facebook,
                      linkedin: Linkedin,
                      github: Github,
                      discord: MessageCircle
                    }

                    const Icon = icons[platform as keyof typeof icons]
                    if (!Icon) return null

                    return (
                      <Button key={platform} variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <Icon className="w-4 h-4 mr-2" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BrandingManager
