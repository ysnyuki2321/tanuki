"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  EnhancedAdminService, 
  type BrandingConfig 
} from "@/lib/enhanced-admin"
import { 
  Palette,
  Upload,
  Save,
  RefreshCw,
  Eye,
  Type,
  Globe,
  Mail,
  Image,
  Monitor,
  Smartphone,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2
} from "lucide-react"

interface ColorPreset {
  name: string
  primary: string
  secondary: string
  accent: string
  preview: string
}

const colorPresets: ColorPreset[] = [
  {
    name: "Ocean Blue",
    primary: "#3b82f6",
    secondary: "#64748b", 
    accent: "#06b6d4",
    preview: "linear-gradient(135deg, #3b82f6, #06b6d4)"
  },
  {
    name: "Forest Green", 
    primary: "#10b981",
    secondary: "#6b7280",
    accent: "#34d399",
    preview: "linear-gradient(135deg, #10b981, #34d399)"
  },
  {
    name: "Sunset Orange",
    primary: "#f59e0b",
    secondary: "#6b7280", 
    accent: "#fb923c",
    preview: "linear-gradient(135deg, #f59e0b, #fb923c)"
  },
  {
    name: "Royal Purple",
    primary: "#8b5cf6",
    secondary: "#64748b",
    accent: "#a855f7", 
    preview: "linear-gradient(135deg, #8b5cf6, #a855f7)"
  },
  {
    name: "Rose Red",
    primary: "#ef4444",
    secondary: "#6b7280",
    accent: "#f87171",
    preview: "linear-gradient(135deg, #ef4444, #f87171)"
  },
  {
    name: "Dark Mode",
    primary: "#1f2937",
    secondary: "#9ca3af",
    accent: "#3b82f6",
    preview: "linear-gradient(135deg, #1f2937, #374151)"
  }
]

const fontOptions = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Poppins", value: "Poppins, sans-serif" },
  { name: "Lato", value: "Lato, sans-serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
  { name: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { name: "Nunito", value: "Nunito, sans-serif" }
]

export function BrandingManagement() {
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b", 
    accentColor: "#06b6d4",
    fontFamily: "Inter, sans-serif",
    metaTitle: "",
    metaDescription: "",
    footerText: "",
    copyrightText: "",
    supportEmail: "",
    customCSS: "",
    socialLinks: {
      website: "",
      twitter: "",
      github: "",
      linkedin: ""
    }
  })

  const adminService = EnhancedAdminService.getInstance()

  useEffect(() => {
    loadBrandingConfig()
  }, [])

  const loadBrandingConfig = async () => {
    try {
      setLoading(true)
      const brandingConfig = await adminService.getBrandingConfig()
      if (brandingConfig) {
        setConfig(brandingConfig)
        setForm({
          name: brandingConfig.name,
          primaryColor: brandingConfig.primaryColor,
          secondaryColor: brandingConfig.secondaryColor,
          accentColor: brandingConfig.accentColor,
          fontFamily: brandingConfig.fontFamily,
          metaTitle: brandingConfig.metaTitle,
          metaDescription: brandingConfig.metaDescription,
          footerText: brandingConfig.footerText,
          copyrightText: brandingConfig.copyrightText,
          supportEmail: brandingConfig.supportEmail,
          customCSS: brandingConfig.customCSS || "",
          socialLinks: brandingConfig.socialLinks
        })
      }
    } catch (error) {
      console.error('Failed to load branding config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const success = await adminService.updateBrandingConfig(form)
      if (success) {
        await loadBrandingConfig()
        // Apply changes to current page for preview
        applyBrandingPreview()
      }
    } catch (error) {
      console.error('Failed to save branding config:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const result = await adminService.uploadLogo(file)
      if (result.success && result.url) {
        await adminService.updateBrandingConfig({ logoUrl: result.url })
        await loadBrandingConfig()
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const applyColorPreset = (preset: ColorPreset) => {
    setForm(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }))
  }

  const applyBrandingPreview = () => {
    // Apply CSS custom properties for live preview
    const root = document.documentElement
    root.style.setProperty('--primary', form.primaryColor)
    root.style.setProperty('--secondary', form.secondaryColor)
    root.style.setProperty('--accent', form.accentColor)
    
    // Apply font family
    if (form.fontFamily) {
      root.style.setProperty('--font-family', form.fontFamily)
    }
  }

  const generateCSS = () => {
    return `
/* Generated Branding CSS for ${form.name} */
:root {
  --primary: ${form.primaryColor};
  --secondary: ${form.secondaryColor};
  --accent: ${form.accentColor};
  --font-family: ${form.fontFamily};
}

.bg-primary { background-color: var(--primary); }
.text-primary { color: var(--primary); }
.border-primary { border-color: var(--primary); }

.bg-secondary { background-color: var(--secondary); }
.text-secondary { color: var(--secondary); }

.bg-accent { background-color: var(--accent); }
.text-accent { color: var(--accent); }

body {
  font-family: var(--font-family);
}

${form.customCSS}
`
  }

  const downloadCSS = () => {
    const css = generateCSS()
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'branding.css'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding Management</h2>
          <p className="text-muted-foreground">
            Customize your platform's appearance and branding
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadCSS}>
            <Download className="h-4 w-4 mr-2" />
            Export CSS
          </Button>
          <Button variant="outline" onClick={applyBrandingPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Brand Identity */}
        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Brand Identity
              </CardTitle>
              <CardDescription>
                Configure your platform's basic identity and logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Platform Name</Label>
                    <Input
                      id="brandName"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tanuki Storage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={form.supportEmail}
                      onChange={(e) => setForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="support@tanuki.dev"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-3">
                      <Input
                        placeholder="Website URL"
                        value={form.socialLinks.website}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, website: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="Twitter URL"
                        value={form.socialLinks.twitter}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="GitHub URL"
                        value={form.socialLinks.github}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, github: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="LinkedIn URL"
                        value={form.socialLinks.linkedin}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {config?.logoUrl ? (
                        <div className="space-y-4">
                          <img 
                            src={config.logoUrl} 
                            alt="Current logo" 
                            className="max-h-20 mx-auto"
                          />
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingLogo}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Replace Logo
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Image className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <Button 
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingLogo}
                            >
                              {uploadingLogo ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Upload Logo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              SVG, PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Choose colors that represent your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Presets */}
              <div className="space-y-3">
                <Label>Color Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="group relative overflow-hidden rounded-lg border-2 border-muted hover:border-primary transition-colors"
                    >
                      <div 
                        className="h-20 w-full"
                        style={{ background: preset.preview }}
                      />
                      <div className="p-2 bg-background">
                        <p className="text-xs font-medium">{preset.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-20 h-10 p-1 border rounded"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-20 h-10 p-1 border rounded"
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={(e) => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-20 h-10 p-1 border rounded"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#06b6d4"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="space-y-3">
                <Label>Color Preview</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div 
                      className="h-16 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      Primary
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Buttons, links, highlights
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div 
                      className="h-16 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.secondaryColor }}
                    >
                      Secondary
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Text, borders, backgrounds
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div 
                      className="h-16 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.accentColor }}
                    >
                      Accent
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Notifications, badges
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Choose fonts that match your brand personality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="fontFamily">Font Family</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {fontOptions.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setForm(prev => ({ ...prev, fontFamily: font.value }))}
                      className={`p-4 border rounded-lg text-left transition-colors hover:border-primary ${
                        form.fontFamily === font.value ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                    >
                      <p className="font-medium" style={{ fontFamily: font.value }}>
                        {font.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: font.value }}>
                        The quick brown fox
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Typography Preview</Label>
                <div className="border rounded-lg p-6 space-y-4" style={{ fontFamily: form.fontFamily }}>
                  <h1 className="text-3xl font-bold" style={{ color: form.primaryColor }}>
                    {form.name || 'Your Platform Name'}
                  </h1>
                  <h2 className="text-xl font-semibold" style={{ color: form.secondaryColor }}>
                    Welcome to the future of file storage
                  </h2>
                  <p className="text-base" style={{ color: form.secondaryColor }}>
                    This is how your regular text will appear throughout the platform. 
                    The font choice affects readability and user experience.
                  </p>
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: `2px solid ${form.accentColor}`,
                        color: form.accentColor
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom CSS */}
              <div className="space-y-3">
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={form.customCSS}
                  onChange={(e) => setForm(prev => ({ ...prev, customCSS: e.target.value }))}
                  placeholder="/* Add your custom CSS here */
.custom-header {
  background: linear-gradient(45deg, var(--primary), var(--accent));
}

.custom-text {
  font-weight: 600;
  color: var(--primary);
}"
                  rows={8}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use CSS variables: --primary, --secondary, --accent, --font-family
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO & Meta Information
                </CardTitle>
                <CardDescription>
                  Configure how your platform appears in search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={form.metaTitle}
                    onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="Tanuki Storage - Modern Cloud Storage Platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={form.metaDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Secure, fast, and reliable cloud storage solution for businesses and individuals."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Footer Content
                </CardTitle>
                <CardDescription>
                  Customize footer text and copyright information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={form.footerText}
                    onChange={(e) => setForm(prev => ({ ...prev, footerText: e.target.value }))}
                    placeholder="Built with love by the Tanuki team"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyrightText">Copyright Text</Label>
                  <Input
                    id="copyrightText"
                    value={form.copyrightText}
                    onChange={(e) => setForm(prev => ({ ...prev, copyrightText: e.target.value }))}
                    placeholder="© 2024 Tanuki Storage. All rights reserved."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your branding changes will look
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
              }`}>
                {/* Preview Header */}
                <div 
                  className="p-4 text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`,
                    fontFamily: form.fontFamily
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {config?.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-8" />
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded"></div>
                      )}
                      <h1 className="text-xl font-bold">{form.name || 'Platform Name'}</h1>
                    </div>
                    <nav className="flex space-x-4 text-sm">
                      <a href="#" className="hover:underline">Dashboard</a>
                      <a href="#" className="hover:underline">Files</a>
                      <a href="#" className="hover:underline">Settings</a>
                    </nav>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-6 bg-background" style={{ fontFamily: form.fontFamily }}>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: form.primaryColor }}>
                    Welcome to {form.name || 'Your Platform'}
                  </h2>
                  <p className="mb-6" style={{ color: form.secondaryColor }}>
                    {form.metaDescription || 'This is your platform description that appears in the meta tags and welcome messages.'}
                  </p>
                  
                  <div className="flex space-x-3 mb-6">
                    <button 
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      Get Started
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: `2px solid ${form.accentColor}`,
                        color: form.accentColor
                      }}
                    >
                      Learn More
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {['Storage', 'Files', 'Users'].map((item, index) => (
                      <div key={item} className="text-center p-4 border rounded-lg">
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white"
                          style={{ backgroundColor: form.accentColor }}
                        >
                          {index + 1}
                        </div>
                        <h3 className="font-medium" style={{ color: form.primaryColor }}>
                          {item}
                        </h3>
                        <p className="text-sm" style={{ color: form.secondaryColor }}>
                          Feature description
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="p-4 border-t bg-muted/50" style={{ fontFamily: form.fontFamily }}>
                  <div className="text-center">
                    <p className="text-sm" style={{ color: form.secondaryColor }}>
                      {form.footerText || 'Footer text will appear here'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: form.secondaryColor }}>
                      {form.copyrightText || 'Copyright text will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
