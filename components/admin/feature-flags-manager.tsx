'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Flag, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Toggle, 
  Target, 
  Settings, 
  Activity, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Percent,
  Users,
  Globe
} from 'lucide-react'
import type { DbFeatureFlag, DbFeatureFlagValue } from '@/lib/feature-flags-schema'

interface FeatureFlagFormData {
  key: string
  name: string
  description: string
  flagType: 'boolean' | 'string' | 'number' | 'json'
  defaultValue: any
  isGlobal: boolean
  environments: string[]
  tags: string[]
}

interface FlagValue {
  environment: string
  value: any
  enabled: boolean
  rolloutPercentage: number
  conditions?: any
}

export function FeatureFlagsManager() {
  const { user, tenant } = useAuth()
  const [flags, setFlags] = useState<DbFeatureFlag[]>([])
  const [flagValues, setFlagValues] = useState<Record<string, DbFeatureFlagValue[]>>({})
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<DbFeatureFlag | null>(null)
  const [activeTab, setActiveTab] = useState('flags')

  // Form state
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    key: '',
    name: '',
    description: '',
    flagType: 'boolean',
    defaultValue: false,
    isGlobal: false,
    environments: ['development', 'staging', 'production'],
    tags: []
  })

  // Load flags and values
  useEffect(() => {
    loadFlags()
  }, [tenant])

  const loadFlags = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/feature-flags?tenantId=${tenant?.id || ''}`)
      if (!response.ok) throw new Error('Failed to load flags')
      
      const data = await response.json()
      setFlags(data.flags || [])
      setFlagValues(data.flagValues || {})
    } catch (error) {
      toast.error('Failed to load feature flags')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlag = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantId: formData.isGlobal ? null : tenant?.id,
          createdBy: user?.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create flag')
      }

      toast.success('Feature flag created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      loadFlags()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create flag')
    }
  }

  const handleUpdateFlag = async () => {
    if (!selectedFlag) return

    try {
      const response = await fetch(`/api/admin/feature-flags/${selectedFlag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantId: formData.isGlobal ? null : tenant?.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update flag')
      }

      toast.success('Feature flag updated successfully')
      setIsEditDialogOpen(false)
      setSelectedFlag(null)
      resetForm()
      loadFlags()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update flag')
    }
  }

  const handleDeleteFlag = async (flagId: string) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete flag')
      }

      toast.success('Feature flag deleted successfully')
      loadFlags()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete flag')
    }
  }

  const handleToggleFlag = async (flagId: string, environment: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagId}/values`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment,
          enabled,
          updatedBy: user?.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to toggle flag')
      }

      toast.success(`Flag ${enabled ? 'enabled' : 'disabled'} for ${environment}`)
      loadFlags()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle flag')
    }
  }

  const handleCopyFlag = (flag: DbFeatureFlag) => {
    setFormData({
      key: `${flag.key}_copy`,
      name: `${flag.name} (Copy)`,
      description: flag.description || '',
      flagType: flag.flag_type as any,
      defaultValue: flag.default_value,
      isGlobal: flag.is_global,
      environments: flag.environments || ['development', 'staging', 'production'],
      tags: flag.tags || []
    })
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (flag: DbFeatureFlag) => {
    setSelectedFlag(flag)
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description || '',
      flagType: flag.flag_type as any,
      defaultValue: flag.default_value,
      isGlobal: flag.is_global,
      environments: flag.environments || ['development', 'staging', 'production'],
      tags: flag.tags || []
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      flagType: 'boolean',
      defaultValue: false,
      isGlobal: false,
      environments: ['development', 'staging', 'production'],
      tags: []
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'archived':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getEnvironmentStatus = (flagId: string, environment: string) => {
    const values = flagValues[flagId] || []
    const envValue = values.find(v => v.environment === environment)
    return envValue?.enabled ?? false
  }

  const getRolloutPercentage = (flagId: string, environment: string) => {
    const values = flagValues[flagId] || []
    const envValue = values.find(v => v.environment === environment)
    return envValue?.rollout_percentage ?? 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Flags</h2>
          <p className="text-muted-foreground">
            Manage feature flags and rollout strategies
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>
                Create a new feature flag for controlled feature rollouts
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Flag Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="feature_key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Feature Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this flag controls"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flagType">Flag Type</Label>
                  <Select
                    value={formData.flagType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, flagType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <Input
                    id="defaultValue"
                    value={JSON.stringify(formData.defaultValue)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value)
                        setFormData(prev => ({ ...prev, defaultValue: value }))
                      } catch {
                        // Invalid JSON, ignore for now
                      }
                    }}
                    placeholder="false"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlobal: checked }))}
                />
                <Label htmlFor="isGlobal">Global Flag (applies to all tenants)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlag}>Create Flag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="flags">
            <Flag className="h-4 w-4 mr-2" />
            Flags ({flags.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Manage feature flags and their environments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flags.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No feature flags</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first feature flag to get started
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flag
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flag</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environments</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flags.map((flag) => (
                      <TableRow key={flag.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{flag.name}</div>
                            <div className="text-sm text-muted-foreground">{flag.key}</div>
                            {flag.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {flag.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{flag.flag_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(flag.status)}
                            <span className="capitalize">{flag.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {(flag.environments || ['development', 'staging', 'production']).map(env => (
                              <div key={env} className="flex items-center gap-2">
                                <Switch
                                  size="sm"
                                  checked={getEnvironmentStatus(flag.id, env)}
                                  onCheckedChange={(checked) => handleToggleFlag(flag.id, env, checked)}
                                />
                                <span className="text-xs">{env}</span>
                                <div className="flex items-center gap-1">
                                  <Percent className="h-3 w-3" />
                                  <span className="text-xs">{getRolloutPercentage(flag.id, env)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {flag.is_global ? (
                              <>
                                <Globe className="h-4 w-4" />
                                <span className="text-sm">Global</span>
                              </>
                            ) : (
                              <>
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Tenant</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(flag)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyFlag(flag)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{flag.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteFlag(flag.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flag Analytics</CardTitle>
              <CardDescription>
                View evaluation statistics and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Evaluations</p>
                          <p className="text-2xl font-bold">1,234</p>
                        </div>
                        <Activity className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Flags</p>
                          <p className="text-2xl font-bold">{flags.filter(f => f.enabled).length}</p>
                        </div>
                        <Flag className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-2xl font-bold">99.2%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Trends</CardTitle>
                    <CardDescription>Flag evaluation activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>Chart visualization would be implemented here</p>
                        <p className="text-sm">Connect to analytics backend for real data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update feature flag configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-key">Flag Key</Label>
                <Input
                  id="edit-key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isGlobal"
                checked={formData.isGlobal}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlobal: checked }))}
              />
              <Label htmlFor="edit-isGlobal">Global Flag (applies to all tenants)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFlag}>Update Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
