"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Calendar
} from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  UserPlus,
  Mail,
  Shield,
  HardDrive,
  Calendar as CalendarIcon,
  Ban,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Activity,
  Download,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  Crown,
  TrendingUp,
  Database,
  Copy,
  RefreshCw
} from 'lucide-react'
import { UserManagementService, type UserSearchFilters, type UserStats } from '@/lib/user-management-service'
import type { DbUser } from '@/lib/database-schema'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

export function EnhancedUserManagement() {
  // Data state
  const [users, setUsers] = useState<DbUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({
    query: '',
    role: [],
    status: [],
    dateRange: { from: null, to: null },
    storageUsage: { min: null, max: null, unit: 'GB' },
    sortBy: 'created',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal state
  const [editingUser, setEditingUser] = useState<DbUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityUser, setActivityUser] = useState<DbUser | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)

  // Form state
  const [newPassword, setNewPassword] = useState('')
  const [sendEmailReset, setSendEmailReset] = useState(true)
  const [generateTempPassword, setGenerateTempPassword] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [searchFilters])

  const loadData = async () => {
    try {
      const [usersResult, statsResult] = await Promise.all([
        UserManagementService.getUsers(searchFilters, 50, 0),
        UserManagementService.getUserStats()
      ])
      
      setUsers(usersResult.users)
      setStats(statsResult)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const result = await UserManagementService.getUsers(searchFilters, 50, 0)
      setUsers(result.users)
    } catch (err) {
      console.error('Error loading users:', err)
      toast.error('Failed to load users')
    }
  }

  const handleUserAction = async (action: string, userId: string, additionalData?: any) => {
    setIsProcessing(true)
    try {
      let result: { success: boolean; error?: string; temporaryPassword?: string }

      switch (action) {
        case 'suspend':
          result = await UserManagementService.suspendUser(userId, additionalData?.reason)
          break
        case 'activate':
          result = await UserManagementService.activateUser(userId)
          break
        case 'resetPassword':
          result = await UserManagementService.resetUserPassword(userId, additionalData)
          if (result.success && result.temporaryPassword) {
            toast.success(`Temporary password: ${result.temporaryPassword}`)
          }
          break
        case 'delete':
          result = await UserManagementService.deleteUser(userId)
          break
        case 'update':
          result = await UserManagementService.updateUser(userId, additionalData)
          break
        default:
          result = { success: false, error: 'Unknown action' }
      }

      if (result.success) {
        toast.success(`User ${action} successful`)
        await loadUsers()
        closeModals()
      } else {
        toast.error(result.error || `Failed to ${action} user`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected')
      return
    }

    setIsProcessing(true)
    try {
      switch (action) {
        case 'suspend':
          await Promise.all(
            selectedUsers.map(id => UserManagementService.suspendUser(id, data?.reason))
          )
          break
        case 'activate':
          await Promise.all(
            selectedUsers.map(id => UserManagementService.activateUser(id))
          )
          break
        case 'delete':
          await Promise.all(
            selectedUsers.map(id => UserManagementService.deleteUser(id))
          )
          break
        case 'export':
          const exportResult = await UserManagementService.exportUsers(searchFilters)
          if (exportResult.success && exportResult.data) {
            // Download as CSV
            const csv = convertToCSV(exportResult.data)
            downloadCSV(csv, 'users-export.csv')
          }
          break
      }

      toast.success(`Bulk ${action} completed`)
      await loadUsers()
      setSelectedUsers([])
      setShowBulkModal(false)
    } catch (error) {
      toast.error(`Bulk ${action} failed`)
    } finally {
      setIsProcessing(false)
    }
  }

  const closeModals = () => {
    setShowEditModal(false)
    setShowPasswordModal(false)
    setShowActivityModal(false)
    setShowBulkModal(false)
    setEditingUser(null)
    setActivityUser(null)
    setNewPassword('')
    setSuspensionReason('')
    setSendEmailReset(true)
    setGenerateTempPassword(false)
  }

  const getUserStatus = (user: DbUser): 'active' | 'suspended' | 'pending' => {
    if (user.role === 'suspended') return 'suspended'
    if (!user.email_verified) return 'pending'
    return 'active'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspended': return <Ban className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      suspended: 'destructive' as const,
      pending: 'secondary' as const,
    }
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
  }

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const hasActiveFilters = searchFilters.query || 
    searchFilters.role.length > 0 || 
    searchFilters.status.length > 0 ||
    searchFilters.dateRange.from || 
    searchFilters.dateRange.to ||
    searchFilters.storageUsage.min !== null ||
    searchFilters.storageUsage.max !== null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{stats.adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold">{stats.newUsersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchFilters.query}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    searchFilters.query && 'query',
                    searchFilters.role.length > 0 && 'role',
                    searchFilters.status.length > 0 && 'status',
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            {selectedUsers.length > 0 && (
              <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                Bulk Actions ({selectedUsers.length})
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="space-y-2">
                  {['admin', 'user'].map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        checked={searchFilters.role.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              role: [...prev.role, role] 
                            }))
                          } else {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              role: prev.role.filter(r => r !== role) 
                            }))
                          }
                        }}
                      />
                      <Label className="capitalize">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="space-y-2">
                  {['active', 'suspended', 'pending'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        checked={searchFilters.status.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              status: [...prev.status, status] 
                            }))
                          } else {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              status: prev.status.filter(s => s !== status) 
                            }))
                          }
                        }}
                      />
                      <Label className="capitalize">{status}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={`${searchFilters.sortBy}-${searchFilters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-') as [any, 'asc' | 'desc']
                    setSearchFilters(prev => ({ ...prev, sortBy, sortOrder }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="email-asc">Email A-Z</SelectItem>
                    <SelectItem value="email-desc">Email Z-A</SelectItem>
                    <SelectItem value="created-desc">Newest First</SelectItem>
                    <SelectItem value="created-asc">Oldest First</SelectItem>
                    <SelectItem value="lastLogin-desc">Last Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({users.length})</span>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Try adjusting your search criteria' : 'No users have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedUsers.length === users.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(users.map(u => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const status = getUserStatus(user)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, user.id])
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            {getStatusBadge(status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Database className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {formatBytes(user.storage_quota || 0)} quota
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.last_login ? 
                              formatDistanceToNow(new Date(user.last_login)) + ' ago' : 
                              'Never'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingUser(user)
                                  setShowEditModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingUser(user)
                                  setShowPasswordModal(true)
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  setActivityUser(user)
                                  setShowActivityModal(true)
                                }}
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {status === 'active' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction('suspend', user.id)}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : status === 'suspended' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction('activate', user.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : null}
                              
                              <DropdownMenuItem
                                onClick={() => handleUserAction('delete', user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role || 'user'}
                    onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value as any } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Storage Quota (GB)</Label>
                  <Input
                    type="number"
                    value={Math.round((editingUser.storage_quota || 0) / (1024 * 1024 * 1024))}
                    onChange={(e) => setEditingUser(prev => prev ? { 
                      ...prev, 
                      storage_quota: parseInt(e.target.value) * 1024 * 1024 * 1024 
                    } : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModals}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUserAction('update', editingUser.id, editingUser)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={sendEmailReset}
                  onCheckedChange={(checked) => setSendEmailReset(checked === true)}
                />
                <Label>Send password reset email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={generateTempPassword}
                  onCheckedChange={(checked) => setGenerateTempPassword(checked === true)}
                />
                <Label>Generate temporary password</Label>
              </div>
            </div>

            {!sendEmailReset && !generateTempPassword && (
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModals}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingUser) {
                    handleUserAction('resetPassword', editingUser.id, {
                      newPassword: newPassword || undefined,
                      sendEmail: sendEmailReset,
                      temporaryPassword: generateTempPassword
                    })
                  }
                }}
                disabled={isProcessing || (!sendEmailReset && !generateTempPassword && !newPassword)}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedUsers.length} selected users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('activate')}
                disabled={isProcessing}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Activate All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('suspend')}
                disabled={isProcessing}
              >
                <UserX className="w-4 h-4 mr-2" />
                Suspend All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('export')}
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedUserManagement
