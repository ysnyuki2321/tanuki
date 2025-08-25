"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  Save,
  RefreshCw,
  Shield,
  HardDrive,
  Lock,
  ToggleLeft,
  Gauge,
  Zap,
  Activity,
  Palette,
  AlertTriangle
} from 'lucide-react'
import { 
  AdminConfigService, 
  ConfigValue, 
  CONFIG_CATEGORIES, 
  ConfigCategory 
} from '@/lib/admin-config'
import { toast } from 'sonner'

const CATEGORY_ICONS = {
  Database,
  Shield,
  Mail,
  HardDrive,
  Lock,
  ToggleLeft,
  Gauge,
  Zap,
  Activity,
  Palette
}

export function ConfigurationManager() {
  const [configs, setConfigs] = useState<ConfigValue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('database')
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [configValues, setConfigValues] = useState<Record<string, any>>({})
  const [configHealth, setConfigHealth] = useState({
    database: false,
    email: false,
    storage: false,
    security: false,
    overall: false
  })

  // Load configurations
  useEffect(() => {
    loadConfigs()
    loadConfigHealth()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const data = await AdminConfigService.getConfigs()
      setConfigs(data)
      
      // Convert to key-value pairs for form state
      const values: Record<string, any> = {}
      data.forEach(config => {
        values[config.key] = config.value
      })
      setConfigValues(values)
    } catch (error) {
      console.error('Failed to load configs:', error)
      toast.error('Failed to load configurations')
    } finally {
      setLoading(false)
    }
  }

  const loadConfigHealth = async () => {
    try {
      const health = await AdminConfigService.getConfigHealth()
      setConfigHealth(health)
    } catch (error) {
      console.error('Failed to load config health:', error)
    }
  }

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const saveConfig = async (key: string) => {
    try {
      setSaving(true)
      const config = configs.find(c => c.key === key)
      if (!config) return

      const value = configValues[key]

      // Validate the value
      const validation = AdminConfigService.validateConfigValue(value, config.validation_rules)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }

      await AdminConfigService.setConfig(key, value, {
        tenantId: config.tenant_id || undefined,
        description: config.description,
        category: config.category,
        dataType: config.data_type,
        isSensitive: config.is_sensitive,
        validationRules: config.validation_rules,
        requiresRestart: config.requires_restart
      })

      toast.success('Configuration saved successfully')
      
      // Reload health status
      await loadConfigHealth()

      if (config.requires_restart) {
        toast.info('A restart may be required for this change to take effect')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const saveAllConfigs = async () => {
    try {
      setSaving(true)
      const categoryConfigs = configs.filter(c => c.category === activeCategory)
      
      for (const config of categoryConfigs) {
        const value = configValues[config.key]
        
        // Skip if value hasn't changed
        if (value === config.value) continue

        // Validate the value
        const validation = AdminConfigService.validateConfigValue(value, config.validation_rules)
        if (!validation.valid) {
          toast.error(`${config.key}: ${validation.error}`)
          return
        }

        await AdminConfigService.setConfig(config.key, value, {
          tenantId: config.tenant_id || undefined,
          description: config.description,
          category: config.category,
          dataType: config.data_type,
          isSensitive: config.is_sensitive,
          validationRules: config.validation_rules,
          requiresRestart: config.requires_restart
        })
      }

      toast.success('All configurations saved successfully')
      await loadConfigs()
      await loadConfigHealth()
      
      // Check if any configs require restart
      const requiresRestart = categoryConfigs.some(c => 
        c.requires_restart && configValues[c.key] !== c.value
      )
      
      if (requiresRestart) {
        toast.info('Some changes require a restart to take effect')
      }
    } catch (error) {
      console.error('Failed to save configs:', error)
      toast.error('Failed to save configurations')
    } finally {
      setSaving(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      setTesting('database')
      const result = await AdminConfigService.testDatabaseConnection({
        url: configValues.supabase_url,
        anonKey: configValues.supabase_anon_key,
        serviceKey: configValues.supabase_service_key
      })

      if (result.success) {
        toast.success('Database connection successful!')
      } else {
        toast.error(`Database connection failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Database connection test failed')
    } finally {
      setTesting(null)
    }
  }

  const testEmailConnection = async () => {
    try {
      setTesting('email')
      const result = await AdminConfigService.testEmailConnection({
        host: configValues.smtp_host,
        port: parseInt(configValues.smtp_port || '587'),
        user: configValues.smtp_user,
        password: configValues.smtp_password,
        secure: configValues.smtp_secure
      })

      if (result.success) {
        toast.success('Email configuration test successful!')
      } else {
        toast.error(`Email test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Email connection test failed')
    } finally {
      setTesting(null)
    }
  }

  const initializeDefaults = async () => {
    try {
      setLoading(true)
      await AdminConfigService.initializeDefaultConfigs()
      await loadConfigs()
      await loadConfigHealth()
      toast.success('Default configurations initialized')
    } catch (error) {
      console.error('Failed to initialize defaults:', error)
      toast.error('Failed to initialize default configurations')
    } finally {
      setLoading(false)
    }
  }

  const renderConfigField = (config: ConfigValue) => {
    const value = configValues[config.key]
    const isChanged = value !== config.value

    if (config.data_type === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor={config.key}>{config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={config.key}
              checked={value || false}
              onCheckedChange={(checked) => handleConfigChange(config.key, checked)}
            />
            {isChanged && (
              <Button
                size="sm"
                onClick={() => saveConfig(config.key)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              </Button>
            )}
          </div>
        </div>
      )
    }

    if (config.validation_rules?.enum) {
      return (
        <div className="space-y-2">
          <Label htmlFor={config.key}>
            {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {config.validation_rules?.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
          <div className="flex items-center space-x-2">
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleConfigChange(config.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option..." />
              </SelectTrigger>
              <SelectContent>
                {config.validation_rules.enum.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isChanged && (
              <Button
                size="sm"
                onClick={() => saveConfig(config.key)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              </Button>
            )}
          </div>
        </div>
      )
    }

    const isPassword = config.is_sensitive
    const inputType = isPassword && !showSensitive[config.key] ? 'password' : 
                     config.data_type === 'number' ? 'number' : 'text'

    return (
      <div className="space-y-2">
        <Label htmlFor={config.key}>
          {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {config.validation_rules?.required && <span className="text-red-500 ml-1">*</span>}
          {config.is_sensitive && <Lock className="w-3 h-3 inline ml-1" />}
        </Label>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            {config.key.includes('description') || config.key.includes('rules') ? (
              <Textarea
                id={config.key}
                value={value || ''}
                onChange={(e) => handleConfigChange(config.key, e.target.value)}
                placeholder={`Enter ${config.key.replace(/_/g, ' ')}`}
                rows={3}
              />
            ) : (
              <Input
                id={config.key}
                type={inputType}
                value={value || ''}
                onChange={(e) => {
                  const newValue = config.data_type === 'number' ? 
                    parseInt(e.target.value) || 0 : e.target.value
                  handleConfigChange(config.key, newValue)
                }}
                placeholder={`Enter ${config.key.replace(/_/g, ' ')}`}
              />
            )}
            {isPassword && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSensitiveVisibility(config.key)}
              >
                {showSensitive[config.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
          {isChanged && (
            <Button
              size="sm"
              onClick={() => saveConfig(config.key)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            </Button>
          )}
        </div>
        {config.validation_rules && (
          <div className="text-xs text-muted-foreground">
            {config.validation_rules.minLength && `Min length: ${config.validation_rules.minLength}`}
            {config.validation_rules.maxLength && `, Max length: ${config.validation_rules.maxLength}`}
            {config.validation_rules.min && `Min: ${config.validation_rules.min}`}
            {config.validation_rules.max && `, Max: ${config.validation_rules.max}`}
            {config.validation_rules.pattern && `, Pattern: ${config.validation_rules.pattern}`}
          </div>
        )}
      </div>
    )
  }

  const getHealthIcon = (category: string) => {
    switch (category) {
      case 'database': return configHealth.database ? CheckCircle : AlertCircle
      case 'email': return configHealth.email ? CheckCircle : AlertTriangle
      case 'storage': return configHealth.storage ? CheckCircle : AlertCircle
      case 'security': return configHealth.security ? CheckCircle : AlertCircle
      default: return Settings
    }
  }

  const getHealthColor = (category: string) => {
    switch (category) {
      case 'database': return configHealth.database ? 'text-green-500' : 'text-red-500'
      case 'email': return configHealth.email ? 'text-green-500' : 'text-yellow-500'
      case 'storage': return configHealth.storage ? 'text-green-500' : 'text-red-500'
      case 'security': return configHealth.security ? 'text-green-500' : 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const categoryConfigs = configs.filter(config => config.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Configuration</h2>
          <p className="text-muted-foreground">
            Manage all platform settings and configurations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={initializeDefaults}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize Defaults
          </Button>
          <Badge variant={configHealth.overall ? "default" : "destructive"}>
            {configHealth.overall ? 'Healthy' : 'Needs Attention'}
          </Badge>
        </div>
      </div>

      {/* Overall Health Alert */}
      {!configHealth.overall && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some critical configurations are missing or invalid. Please review the Database, Storage, and Security sections.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          {CONFIG_CATEGORIES.map((category) => {
            const IconComponent = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] || Settings
            const HealthIcon = getHealthIcon(category.key)
            const healthColor = getHealthColor(category.key)
            
            return (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="flex items-center space-x-1"
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden lg:inline">{category.name}</span>
                <HealthIcon className={`w-3 h-3 ${healthColor}`} />
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CONFIG_CATEGORIES.map((category) => (
          <TabsContent key={category.key} value={category.key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {React.createElement(
                        CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] || Settings,
                        { className: "w-5 h-5" }
                      )}
                      <span>{category.name}</span>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Category-specific test buttons */}
                    {category.key === 'database' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testDatabaseConnection}
                        disabled={testing === 'database' || !configValues.supabase_url}
                      >
                        {testing === 'database' ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                    )}
                    {category.key === 'email' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testEmailConnection}
                        disabled={testing === 'email' || !configValues.smtp_host}
                      >
                        {testing === 'email' ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        Test Email
                      </Button>
                    )}
                    <Button
                      onClick={saveAllConfigs}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {categoryConfigs.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No configurations found for this category. Click "Initialize Defaults" to create them.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {categoryConfigs.map((config) => (
                      <div key={config.key} className="space-y-2">
                        {renderConfigField(config)}
                        {config.requires_restart && (
                          <p className="text-xs text-orange-500">
                            ⚠️ Requires restart
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default ConfigurationManager
