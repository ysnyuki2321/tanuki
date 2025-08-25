"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  HardDrive, 
  Users, 
  Shield, 
  Zap, 
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  Info,
  Loader2
} from 'lucide-react'
import { 
  FeatureFlagService,
  DEFAULT_FEATURES,
  FEATURE_CATEGORIES,
  type FeatureFlag
} from '@/lib/feature-flags'
import { RealAdminAuthService } from '@/lib/real-admin-auth'
import { toast } from 'sonner'

interface FeatureFlagsManagerProps {
  tenantId?: string
}

export function FeatureFlagsManager({ tenantId }: FeatureFlagsManagerProps) {
  const [features, setFeatures] = useState<(FeatureFlag & { enabled: boolean })[]>([])
  const [originalFeatures, setOriginalFeatures] = useState<(FeatureFlag & { enabled: boolean })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeCategory, setActiveCategory] = useState('core')

  const categoryIcons = {
    core: Settings,
    storage: HardDrive,
    collaboration: Users,
    security: Shield,
    integrations: Zap,
    advanced: Cpu
  }

  // Load features
  useEffect(() => {
    loadFeatures()
  }, [tenantId])

  // Check for changes
  useEffect(() => {
    const hasChanges = features.some((feature, index) => 
      feature.enabled !== originalFeatures[index]?.enabled
    )
    setHasChanges(hasChanges)
  }, [features, originalFeatures])

  const loadFeatures = async () => {
    setIsLoading(true)
    try {
      // Initialize feature flags
      await FeatureFlagService.initializeFlags(tenantId)
      
      // Get all features with their current status
      const allFeatures = await FeatureFlagService.getAllFeatures(tenantId)
      
      setFeatures(allFeatures)
      setOriginalFeatures(allFeatures)
    } catch (error) {
      console.error('Failed to load features:', error)
      toast.error('Failed to load feature flags')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    // Check dependencies
    const feature = features.find(f => f.key === featureKey)
    if (!feature) return

    // If enabling, check dependencies
    if (enabled && feature.dependencies) {
      const missingDeps = feature.dependencies.filter(dep => 
        !features.find(f => f.key === dep)?.enabled
      )
      
      if (missingDeps.length > 0) {
        toast.error(`Cannot enable "${feature.name}". Required dependencies: ${missingDeps.join(', ')}`)
        return
      }
    }

    // If disabling, check dependents
    if (!enabled) {
      const dependents = features.filter(f => 
        f.dependencies?.includes(featureKey) && f.enabled
      )
      
      if (dependents.length > 0) {
        toast.error(`Cannot disable "${feature.name}". It's required by: ${dependents.map(d => d.name).join(', ')}`)
        return
      }
    }

    // Update local state
    setFeatures(prev => prev.map(f => 
      f.key === featureKey ? { ...f, enabled } : f
    ))
  }

  const saveChanges = async () => {
    if (!RealAdminAuthService.hasAdminPermission('config.edit')) {
      toast.error('Insufficient permissions')
      return
    }

    setIsSaving(true)
    try {
      // Build updates object
      const updates: Record<string, boolean> = {}
      features.forEach((feature, index) => {
        if (feature.enabled !== originalFeatures[index]?.enabled) {
          updates[feature.key] = feature.enabled
        }
      })

      // Save bulk updates
      const result = await FeatureFlagService.bulkUpdateFeatures(updates, tenantId)
      
      if (result.success) {
        setOriginalFeatures([...features])
        toast.success('Feature flags updated successfully')
        
        // Log admin action
        RealAdminAuthService.logAdminAction('features.updated', { 
          updates, 
          tenantId: tenantId || 'global' 
        })

        // Show restart warning if needed
        const requiresRestart = features.some(f => 
          f.requiresRestart && updates[f.key] !== undefined
        )
        
        if (requiresRestart) {
          toast.warning('Some changes require a server restart to take effect')
        }
      } else {
        toast.error(result.error || 'Failed to update feature flags')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const resetChanges = () => {
    setFeatures([...originalFeatures])
    toast.info('Changes reverted')
  }

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all features to default values?')) {
      return
    }

    try {
      const result = await FeatureFlagService.resetToDefaults(tenantId)
      if (result.success) {
        await loadFeatures()
        toast.success('Feature flags reset to defaults')
        
        RealAdminAuthService.logAdminAction('features.reset', { 
          tenantId: tenantId || 'global' 
        })
      } else {
        toast.error(result.error || 'Failed to reset features')
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset features')
    }
  }

  const getFeaturesByCategory = (category: string) => {
    return features.filter(f => f.category === category)
  }

  const getFeatureStatus = (feature: FeatureFlag & { enabled: boolean }) => {
    if (feature.enabled) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'Enabled' }
    } else {
      return { icon: XCircle, color: 'text-red-500', label: 'Disabled' }
    }
  }

  const getDependencyStatus = (feature: FeatureFlag & { enabled: boolean }) => {
    if (!feature.dependencies) return null

    const missingDeps = feature.dependencies.filter(dep => 
      !features.find(f => f.key === dep)?.enabled
    )

    if (missingDeps.length > 0) {
      return {
        type: 'missing',
        deps: missingDeps,
        message: `Requires: ${missingDeps.join(', ')}`
      }
    }

    return {
      type: 'satisfied',
      deps: feature.dependencies,
      message: `Dependencies: ${feature.dependencies.join(', ')}`
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading feature flags...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">
            Enable or disable platform features {tenantId ? 'for this tenant' : 'globally'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadFeatures()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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

      {/* Status Alert */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Feature Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-6 w-full">
          {FEATURE_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category.key as keyof typeof categoryIcons]
            const categoryFeatures = getFeaturesByCategory(category.key)
            const enabledCount = categoryFeatures.filter(f => f.enabled).length

            return (
              <TabsTrigger key={category.key} value={category.key} className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {enabledCount}/{categoryFeatures.length}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {FEATURE_CATEGORIES.map((category) => (
          <TabsContent key={category.key} value={category.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(categoryIcons[category.key as keyof typeof categoryIcons], { className: "w-5 h-5" })}
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {getFeaturesByCategory(category.key).map((feature) => {
                      const status = getFeatureStatus(feature)
                      const StatusIcon = status.icon
                      const depStatus = getDependencyStatus(feature)

                      return (
                        <Card key={feature.key} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={feature.enabled}
                                  onCheckedChange={(enabled) => toggleFeature(feature.key, enabled)}
                                />
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                  <h4 className="font-medium">{feature.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {feature.key}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>

                              {/* Dependencies */}
                              {depStatus && (
                                <div className="flex items-center gap-2">
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                  <span className={`text-xs ${
                                    depStatus.type === 'missing' ? 'text-red-600' : 'text-muted-foreground'
                                  }`}>
                                    {depStatus.message}
                                  </span>
                                </div>
                              )}

                              {/* Flags */}
                              <div className="flex items-center gap-2">
                                {feature.requiresRestart && (
                                  <Badge variant="outline" className="text-xs">
                                    Requires Restart
                                  </Badge>
                                )}
                                {feature.tenantConfigurable && (
                                  <Badge variant="outline" className="text-xs">
                                    Tenant Configurable
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {feature.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default FeatureFlagsManager
