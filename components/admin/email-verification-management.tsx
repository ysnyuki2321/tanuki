"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  EnhancedAdminService, 
  type EmailVerificationConfig, 
  type SupabaseConfig, 
  type SMTPConfig, 
  type CustomEmailConfig 
} from "@/lib/enhanced-admin"
import { 
  Mail, 
  Plus, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Globe,
  Code,
  Edit,
  Trash2,
  Key,
  Shield,
  AlertTriangle
} from "lucide-react"

export function EmailVerificationManagement() {
  const [configs, setConfigs] = useState<EmailVerificationConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<EmailVerificationConfig | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<EmailVerificationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({})

  const [configForm, setConfigForm] = useState({
    name: "",
    type: "supabase" as "supabase" | "smtp" | "custom",
    enabled: true,
    config: {} as SupabaseConfig | SMTPConfig | CustomEmailConfig
  })

  const [supabaseForm, setSupabaseForm] = useState({
    projectUrl: "",
    publicKey: "",
    serviceKey: "",
    redirectUrl: "",
    customDomain: ""
  })

  const [smtpForm, setSMTPForm] = useState({
    host: "",
    port: "587",
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Tanuki Storage"
  })

  const [customForm, setCustomForm] = useState({
    apiUrl: "",
    apiKey: "",
    webhookUrl: "",
    provider: ""
  })

  const adminService = EnhancedAdminService.getInstance()

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const configsData = await adminService.getEmailConfigs()
      setConfigs(configsData)
    } catch (error) {
      console.error('Failed to load email configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      let config: SupabaseConfig | SMTPConfig | CustomEmailConfig

      switch (configForm.type) {
        case 'supabase':
          config = supabaseForm
          break
        case 'smtp':
          config = { ...smtpForm, port: parseInt(smtpForm.port) }
          break
        case 'custom':
          config = customForm
          break
      }

      if (editingConfig) {
        await adminService.updateEmailConfig(editingConfig.id, {
          name: configForm.name,
          enabled: configForm.enabled,
          config
        })
      } else {
        await adminService.addEmailConfig({
          name: configForm.name,
          type: configForm.type,
          enabled: configForm.enabled,
          config
        })
      }

      setShowConfigDialog(false)
      resetForm()
      await loadConfigs()
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  const handleTestConfig = async (configId: string) => {
    setTesting(configId)
    try {
      const result = await adminService.testEmailConfig(configId)
      setTestResults(prev => ({ ...prev, [configId]: result }))
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [configId]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }))
    } finally {
      setTesting(null)
    }
  }

  const handleEditConfig = (config: EmailVerificationConfig) => {
    setEditingConfig(config)
    setConfigForm({
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      config: config.config
    })

    // Populate specific form based on type
    switch (config.type) {
      case 'supabase':
        setSupabaseForm(config.config as SupabaseConfig)
        break
      case 'smtp':
        setSMTPForm({
          ...(config.config as SMTPConfig),
          port: String((config.config as SMTPConfig).port)
        })
        break
      case 'custom':
        setCustomForm(config.config as CustomEmailConfig)
        break
    }

    setShowConfigDialog(true)
  }

  const resetForm = () => {
    setEditingConfig(null)
    setConfigForm({
      name: "",
      type: "supabase",
      enabled: true,
      config: {}
    })
    setSupabaseForm({
      projectUrl: "",
      publicKey: "",
      serviceKey: "",
      redirectUrl: "",
      customDomain: ""
    })
    setSMTPForm({
      host: "",
      port: "587",
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "Tanuki Storage"
    })
    setCustomForm({
      apiUrl: "",
      apiKey: "",
      webhookUrl: "",
      provider: ""
    })
  }

  const getConfigIcon = (type: string) => {
    switch (type) {
      case 'supabase':
        return <Database className="h-5 w-5 text-green-600" />
      case 'smtp':
        return <Mail className="h-5 w-5 text-blue-600" />
      case 'custom':
        return <Code className="h-5 w-5 text-purple-600" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Verification Management</h2>
          <p className="text-muted-foreground">
            Configure email verification providers for user registration
          </p>
        </div>
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Email Config
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure email verification provider for user authentication
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="configName">Configuration Name</Label>
                    <Input
                      id="configName"
                      value={configForm.name}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Primary Email Provider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="configType">Provider Type</Label>
                    <Select 
                      value={configForm.type} 
                      onValueChange={(value) => setConfigForm(prev => ({ 
                        ...prev, 
                        type: value as "supabase" | "smtp" | "custom" 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supabase">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Supabase Auth
                          </div>
                        </SelectItem>
                        <SelectItem value="smtp">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            SMTP Server
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Custom API
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={configForm.enabled}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable this configuration</Label>
                </div>
              </div>

              {/* Provider-specific Configuration */}
              <Tabs value={configForm.type} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="supabase">Supabase</TabsTrigger>
                  <TabsTrigger value="smtp">SMTP</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                {/* Supabase Configuration */}
                <TabsContent value="supabase" className="space-y-4">
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      Configure Supabase Auth for email verification. Get your keys from your Supabase project dashboard.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectUrl">Project URL</Label>
                      <Input
                        id="projectUrl"
                        value={supabaseForm.projectUrl}
                        onChange={(e) => setSupabaseForm(prev => ({ ...prev, projectUrl: e.target.value }))}
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publicKey">Public Anon Key</Label>
                      <Input
                        id="publicKey"
                        value={supabaseForm.publicKey}
                        onChange={(e) => setSupabaseForm(prev => ({ ...prev, publicKey: e.target.value }))}
                        placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceKey">Service Role Key</Label>
                    <Input
                      id="serviceKey"
                      type="password"
                      value={supabaseForm.serviceKey}
                      onChange={(e) => setSupabaseForm(prev => ({ ...prev, serviceKey: e.target.value }))}
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="redirectUrl">Redirect URL</Label>
                      <Input
                        id="redirectUrl"
                        value={supabaseForm.redirectUrl}
                        onChange={(e) => setSupabaseForm(prev => ({ ...prev, redirectUrl: e.target.value }))}
                        placeholder="https://your-app.com/auth/callback"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                      <Input
                        id="customDomain"
                        value={supabaseForm.customDomain}
                        onChange={(e) => setSupabaseForm(prev => ({ ...prev, customDomain: e.target.value }))}
                        placeholder="auth.your-domain.com"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* SMTP Configuration */}
                <TabsContent value="smtp" className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Configure SMTP server for sending verification emails. Works with Gmail, Outlook, SendGrid, etc.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={smtpForm.host}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={smtpForm.port}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpSecure"
                      checked={smtpForm.secure}
                      onCheckedChange={(checked) => setSMTPForm(prev => ({ ...prev, secure: checked }))}
                    />
                    <Label htmlFor="smtpSecure">Use SSL/TLS encryption</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">Username</Label>
                      <Input
                        id="smtpUsername"
                        value={smtpForm.username}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={smtpForm.password}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="App password or regular password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromEmail">From Email</Label>
                      <Input
                        id="smtpFromEmail"
                        value={smtpForm.fromEmail}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                        placeholder="noreply@tanuki.dev"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input
                        id="smtpFromName"
                        value={smtpForm.fromName}
                        onChange={(e) => setSMTPForm(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="Tanuki Storage"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Custom API Configuration */}
                <TabsContent value="custom" className="space-y-4">
                  <Alert>
                    <Code className="h-4 w-4" />
                    <AlertDescription>
                      Configure custom email API for providers like SendGrid, Mailgun, Amazon SES, etc.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customProvider">Provider Name</Label>
                      <Input
                        id="customProvider"
                        value={customForm.provider}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, provider: e.target.value }))}
                        placeholder="SendGrid, Mailgun, Amazon SES"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customApiKey">API Key</Label>
                      <Input
                        id="customApiKey"
                        type="password"
                        value={customForm.apiKey}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Your API key"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customApiUrl">API URL</Label>
                    <Input
                      id="customApiUrl"
                      value={customForm.apiUrl}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                      placeholder="https://api.sendgrid.com/v3/mail/send"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customWebhook">Webhook URL (Optional)</Label>
                    <Input
                      id="customWebhook"
                      value={customForm.webhookUrl}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://your-app.com/webhooks/email"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Email Configurations</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure email verification providers to enable user registration
                  </p>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            configs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getConfigIcon(config.type)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {config.name}
                          <Badge variant={config.enabled ? "default" : "secondary"}>
                            {config.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {config.type} Configuration • Created {new Date(config.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConfig(config.id)}
                        disabled={testing === config.id}
                      >
                        {testing === config.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditConfig(config)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Configuration Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{config.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{config.enabled ? 'Active' : 'Disabled'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{new Date(config.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Provider</p>
                        <p className="font-medium">
                          {config.type === 'supabase' && 'Supabase Auth'}
                          {config.type === 'smtp' && (config.config as SMTPConfig).host}
                          {config.type === 'custom' && (config.config as CustomEmailConfig).provider}
                        </p>
                      </div>
                    </div>

                    {/* Test Results */}
                    {testResults[config.id] && (
                      <Alert variant={testResults[config.id].success ? "default" : "destructive"}>
                        {testResults[config.id].success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          {testResults[config.id].success 
                            ? "Configuration test successful!" 
                            : `Test failed: ${testResults[config.id].error}`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Configuration Preview */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Configuration Preview</h4>
                      <div className="text-sm space-y-1">
                        {config.type === 'supabase' && (
                          <div>
                            <span className="text-muted-foreground">Project URL: </span>
                            <span className="font-mono">{(config.config as SupabaseConfig).projectUrl}</span>
                          </div>
                        )}
                        {config.type === 'smtp' && (
                          <div>
                            <span className="text-muted-foreground">SMTP: </span>
                            <span className="font-mono">
                              {(config.config as SMTPConfig).host}:{(config.config as SMTPConfig).port}
                            </span>
                          </div>
                        )}
                        {config.type === 'custom' && (
                          <div>
                            <span className="text-muted-foreground">API: </span>
                            <span className="font-mono">{(config.config as CustomEmailConfig).apiUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
