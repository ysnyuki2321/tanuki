'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  Clock, 
  Eye,
  Settings,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  Plus,
  Edit3
} from 'lucide-react'

interface RateLimitRule {
  id: string
  name: string
  path: string
  method: string
  windowMs: number
  maxRequests: number
  enabled: boolean
  userTier?: string
  description?: string
  createdAt: Date
  lastUpdated: Date
}

interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  topBlockedIPs: Array<{ ip: string; count: number }>
  topBlockedPaths: Array<{ path: string; count: number }>
  hourlyStats: Array<{ hour: string; requests: number; blocked: number }>
}

interface ActiveRateLimit {
  key: string
  count: number
  limit: number
  remaining: number
  resetTime: Date
  path: string
  userInfo?: string
}

export function RateLimitManager() {
  const [rules, setRules] = useState<RateLimitRule[]>([])
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [activeLimits, setActiveLimits] = useState<ActiveRateLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<RateLimitRule | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    method: 'ALL',
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    userTier: 'all',
    description: '',
    enabled: true
  })

  useEffect(() => {
    loadData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    setRefreshInterval(interval)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [rulesResponse, statsResponse, activeLimitsResponse] = await Promise.all([
        fetch('/api/admin/rate-limits/rules'),
        fetch('/api/admin/rate-limits/stats'),
        fetch('/api/admin/rate-limits/active')
      ])

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setRules(rulesData.rules || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (activeLimitsResponse.ok) {
        const activeLimitsData = await activeLimitsResponse.json()
        setActiveLimits(activeLimitsData.activeLimits || [])
      }
    } catch (error) {
      console.error('Failed to load rate limit data:', error)
      toast.error('Failed to load rate limit data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create rule')
      }

      toast.success('Rate limit rule created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create rule')
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/rate-limits/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle rule')
      }

      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`)
      loadData()
    } catch (error) {
      toast.error('Failed to toggle rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/rate-limits/rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete rule')
      }

      toast.success('Rule deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete rule')
    }
  }

  const handleClearActiveLimit = async (key: string) => {
    try {
      const response = await fetch('/api/admin/rate-limits/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      if (!response.ok) {
        throw new Error('Failed to clear rate limit')
      }

      toast.success('Rate limit cleared successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to clear rate limit')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      method: 'ALL',
      windowMs: 60000,
      maxRequests: 100,
      userTier: 'all',
      description: '',
      enabled: true
    })
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${ms / 1000}s`
    if (ms < 3600000) return `${ms / 60000}m`
    return `${ms / 3600000}h`
  }

  const getMethodBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'PATCH': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !stats) {
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
          <h2 className="text-2xl font-bold tracking-tight">Rate Limiting</h2>
          <p className="text-muted-foreground">
            Configure and monitor API rate limits and security policies
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Rate Limit Rule</DialogTitle>
                <DialogDescription>
                  Configure a new rate limiting rule for API endpoints
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Auth Rate Limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-path">Path Pattern</Label>
                    <Input
                      id="rule-path"
                      value={formData.path}
                      onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                      placeholder="/api/auth/*"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-method">HTTP Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Methods</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-window">Time Window (ms)</Label>
                    <Input
                      id="rule-window"
                      type="number"
                      value={formData.windowMs}
                      onChange={(e) => setFormData(prev => ({ ...prev, windowMs: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-max">Max Requests</Label>
                    <Input
                      id="rule-max"
                      type="number"
                      value={formData.maxRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRequests: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-tier">User Tier</Label>
                  <Select
                    value={formData.userTier}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, userTier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="anonymous">Anonymous Only</SelectItem>
                      <SelectItem value="authenticated">Authenticated Only</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                      <SelectItem value="admin">Admin Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description</Label>
                  <Input
                    id="rule-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Limit authentication attempts to prevent brute force"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>Create Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.blockedRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</div>
              <p className="text-xs text-muted-foreground">
                {rules.length} total rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Limits</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLimits.length}</div>
              <p className="text-xs text-muted-foreground">Currently rate limited</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="active">
            <Activity className="h-4 w-4 mr-2" />
            Active Limits
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Rules</CardTitle>
              <CardDescription>
                Configure rate limiting rules for different API endpoints and user types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No rate limit rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first rate limit rule to protect your API
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead>User Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            {rule.description && (
                              <div className="text-sm text-muted-foreground">{rule.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{rule.path}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMethodBadgeColor(rule.method)}>
                            {rule.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{rule.maxRequests} requests</div>
                            <div className="text-muted-foreground">per {formatDuration(rule.windowMs)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.userTier || 'all'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {rule.enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm">
                              {rule.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                            >
                              {rule.enabled ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              Delete
                            </Button>
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

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Rate Limits</CardTitle>
              <CardDescription>
                Currently active rate limits and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeLimits.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active rate limits</h3>
                  <p className="text-muted-foreground">
                    All requests are currently within rate limits
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Resets At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLimits.map((limit) => (
                      <TableRow key={limit.key}>
                        <TableCell>
                          <div>
                            <code className="text-sm">{limit.key}</code>
                            {limit.userInfo && (
                              <div className="text-xs text-muted-foreground">{limit.userInfo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{limit.path}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm">
                              {limit.count} / {limit.limit}
                            </div>
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  limit.count >= limit.limit 
                                    ? 'bg-red-500' 
                                    : limit.count / limit.limit > 0.8 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min((limit.count / limit.limit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(limit.resetTime).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearActiveLimit(limit.key)}
                          >
                            Clear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6">
            {stats && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Blocked IPs</CardTitle>
                      <CardDescription>IP addresses with the most blocked requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.topBlockedIPs.map((item) => (
                          <div key={item.ip} className="flex justify-between items-center">
                            <code className="text-sm">{item.ip}</code>
                            <Badge variant="destructive">{item.count} blocked</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Blocked Paths</CardTitle>
                      <CardDescription>API endpoints with the most rate limit violations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.topBlockedPaths.map((item) => (
                          <div key={item.path} className="flex justify-between items-center">
                            <code className="text-sm">{item.path}</code>
                            <Badge variant="destructive">{item.count} blocked</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Request Statistics</CardTitle>
                    <CardDescription>Request and block patterns over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Detailed analytics charts would be implemented here</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
