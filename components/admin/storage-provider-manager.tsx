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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Cloud, 
  Plus, 
  Edit3, 
  Trash2, 
  Settings, 
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  TestTube,
  RefreshCw,
  CloudRain,
  HardDrive,
  Globe
} from 'lucide-react'

interface StorageProvider {
  id: string
  name: string
  type: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
  bucketName: string
  region?: string
  isDefault: boolean
  isActive: boolean
  credentials: Record<string, any>
  lastHealthCheck?: Date
  healthStatus: 'healthy' | 'unhealthy' | 'unknown'
  createdAt: Date
}

interface StorageConfig {
  name: string
  type: 'supabase' | 's3' | 'gcs' | 'azure' | 'local'
  bucketName: string
  region?: string
  credentials: Record<string, any>
  isDefault?: boolean
}

export function StorageProviderManager() {
  const { user, tenant } = useAuth()
  const [providers, setProviders] = useState<StorageProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<StorageProvider | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<StorageConfig>({
    name: '',
    type: 'supabase',
    bucketName: '',
    region: '',
    credentials: {},
    isDefault: false
  })

  const providerIcons = {
    supabase: CloudRain,
    s3: Cloud,
    gcs: Globe,
    azure: Cloud,
    local: HardDrive
  }

  const providerColors = {
    supabase: 'bg-green-100 text-green-800',
    s3: 'bg-orange-100 text-orange-800',
    gcs: 'bg-blue-100 text-blue-800',
    azure: 'bg-blue-100 text-blue-800',
    local: 'bg-gray-100 text-gray-800'
  }

  // Load providers
  useEffect(() => {
    loadProviders()
  }, [tenant])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/storage/providers?tenantId=${tenant?.id || ''}`)
      if (!response.ok) throw new Error('Failed to load providers')
      
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      toast.error('Failed to load storage providers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProvider = async () => {
    try {
      const response = await fetch('/api/admin/storage/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantId: tenant?.id,
          createdBy: user?.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create provider')
      }

      toast.success('Storage provider created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      loadProviders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create provider')
    }
  }

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return

    try {
      const response = await fetch(`/api/admin/storage/providers/${selectedProvider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update provider')
      }

      toast.success('Storage provider updated successfully')
      setIsEditDialogOpen(false)
      setSelectedProvider(null)
      resetForm()
      loadProviders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update provider')
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/storage/providers/${providerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete provider')
      }

      toast.success('Storage provider deleted successfully')
      loadProviders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete provider')
    }
  }

  const handleTestConnection = async (providerId: string) => {
    try {
      setTestingConnection(providerId)
      const response = await fetch(`/api/admin/storage/providers/${providerId}/test`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Connection test failed')
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Connection test successful')
      } else {
        toast.error('Connection test failed')
      }

      loadProviders() // Refresh to get updated health status
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection test failed')
    } finally {
      setTestingConnection(null)
    }
  }

  const handleSetDefault = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/storage/providers/${providerId}/default`, {
        method: 'PUT'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to set default provider')
      }

      toast.success('Default storage provider updated')
      loadProviders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default provider')
    }
  }

  const openEditDialog = (provider: StorageProvider) => {
    setSelectedProvider(provider)
    setFormData({
      name: provider.name,
      type: provider.type,
      bucketName: provider.bucketName,
      region: provider.region || '',
      credentials: provider.credentials,
      isDefault: provider.isDefault
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'supabase',
      bucketName: '',
      region: '',
      credentials: {},
      isDefault: false
    })
  }

  const renderCredentialsForm = () => {
    switch (formData.type) {
      case 'supabase':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                value={formData.credentials.url || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, url: e.target.value }
                }))}
                placeholder="https://your-project.supabase.co"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-anon-key">Anon Key</Label>
              <Input
                id="supabase-anon-key"
                type="password"
                value={formData.credentials.anonKey || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, anonKey: e.target.value }
                }))}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-service-key">Service Role Key (Optional)</Label>
              <Input
                id="supabase-service-key"
                type="password"
                value={formData.credentials.serviceKey || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, serviceKey: e.target.value }
                }))}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
          </div>
        )

      case 's3':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s3-access-key">Access Key ID</Label>
              <Input
                id="s3-access-key"
                value={formData.credentials.accessKeyId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, accessKeyId: e.target.value }
                }))}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3-secret-key">Secret Access Key</Label>
              <Input
                id="s3-secret-key"
                type="password"
                value={formData.credentials.secretAccessKey || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, secretAccessKey: e.target.value }
                }))}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3-session-token">Session Token (Optional)</Label>
              <Input
                id="s3-session-token"
                type="password"
                value={formData.credentials.sessionToken || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, sessionToken: e.target.value }
                }))}
                placeholder="AQoDYXdzEJr..."
              />
            </div>
          </div>
        )

      case 'gcs':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gcs-project-id">Project ID</Label>
              <Input
                id="gcs-project-id"
                value={formData.credentials.projectId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, projectId: e.target.value }
                }))}
                placeholder="my-gcp-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcs-key-file">Service Account Key File Path</Label>
              <Input
                id="gcs-key-file"
                value={formData.credentials.keyFilename || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, keyFilename: e.target.value }
                }))}
                placeholder="/path/to/service-account-key.json"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcs-credentials">Service Account Credentials (JSON)</Label>
              <Textarea
                id="gcs-credentials"
                value={formData.credentials.credentials ? JSON.stringify(formData.credentials.credentials, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const credentials = JSON.parse(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      credentials: { ...prev.credentials, credentials }
                    }))
                  } catch {
                    // Invalid JSON, ignore for now
                  }
                }}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={5}
              />
            </div>
          </div>
        )

      case 'azure':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="azure-connection-string">Connection String</Label>
              <Input
                id="azure-connection-string"
                type="password"
                value={formData.credentials.connectionString || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, connectionString: e.target.value }
                }))}
                placeholder="DefaultEndpointsProtocol=https;AccountName=..."
              />
            </div>
            <div className="text-center text-sm text-muted-foreground my-4">OR</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="azure-account-name">Account Name</Label>
                <Input
                  id="azure-account-name"
                  value={formData.credentials.accountName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, accountName: e.target.value }
                  }))}
                  placeholder="mystorageaccount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-account-key">Account Key</Label>
                <Input
                  id="azure-account-key"
                  type="password"
                  value={formData.credentials.accountKey || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, accountKey: e.target.value }
                  }))}
                  placeholder="..."
                />
              </div>
            </div>
          </div>
        )

      case 'local':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="local-base-path">Base Path</Label>
              <Input
                id="local-base-path"
                value={formData.credentials.basePath || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, basePath: e.target.value }
                }))}
                placeholder="/var/storage"
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Local storage should only be used for development or testing purposes.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Storage Providers</h2>
          <p className="text-muted-foreground">
            Manage multi-cloud storage configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Storage Provider</DialogTitle>
              <DialogDescription>
                Configure a new cloud storage provider
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My S3 Storage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ 
                      ...prev, 
                      type: value,
                      credentials: {} // Reset credentials when type changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supabase">Supabase Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure">Azure Blob Storage</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bucket-name">
                    {formData.type === 'azure' ? 'Container Name' : 'Bucket Name'}
                  </Label>
                  <Input
                    id="bucket-name"
                    value={formData.bucketName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bucketName: e.target.value }))}
                    placeholder={formData.type === 'azure' ? 'my-container' : 'my-bucket'}
                  />
                </div>
                {formData.type !== 'local' && (
                  <div className="space-y-2">
                    <Label htmlFor="region">Region (Optional)</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      placeholder="us-east-1"
                    />
                  </div>
                )}
              </div>

              {renderCredentialsForm()}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label htmlFor="is-default">Set as default provider</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProvider}>Add Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {providers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No storage providers configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first storage provider to enable multi-cloud storage capabilities
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </CardContent>
          </Card>
        ) : (
          providers.map((provider) => {
            const ProviderIcon = providerIcons[provider.type]
            return (
              <Card key={provider.id} className={provider.isDefault ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${providerColors[provider.type]}`}>
                        <ProviderIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {provider.name}
                          {provider.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                          {!provider.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {provider.type.toUpperCase()} • {provider.bucketName}
                          {provider.region && ` • ${provider.region}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getHealthStatusIcon(provider.healthStatus)}
                        <span className="text-sm capitalize">{provider.healthStatus}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingConnection === provider.id}
                      >
                        {testingConnection === provider.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(provider)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {!provider.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(provider.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      {!provider.isDefault && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Storage Provider</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{provider.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProvider(provider.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Storage Provider</DialogTitle>
            <DialogDescription>
              Update storage provider configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Provider Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Provider Type</Label>
                <Input
                  id="edit-type"
                  value={formData.type.toUpperCase()}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bucket">
                  {formData.type === 'azure' ? 'Container Name' : 'Bucket Name'}
                </Label>
                <Input
                  id="edit-bucket"
                  value={formData.bucketName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bucketName: e.target.value }))}
                />
              </div>
              {formData.type !== 'local' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-region">Region</Label>
                  <Input
                    id="edit-region"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {renderCredentialsForm()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProvider}>Update Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
