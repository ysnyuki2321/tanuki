"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdvancedAuthService, type User, type LoginAttempt, type AuthSession } from "@/lib/advanced-auth"
import { formatBytes } from "@/lib/utils"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldX,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  HardDrive,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  Settings,
  Crown,
  UserCheck,
  UserX,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Zap
} from "lucide-react"

interface AdvancedUserManagementProps {
  users: User[]
  onUsersChange: (users: User[]) => void
}

export function AdvancedUserManagement({ users, onUsersChange }: AdvancedUserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [userSessions, setUserSessions] = useState<AuthSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const authService = AdvancedAuthService.getInstance()

  useEffect(() => {
    loadLoginAttempts()
  }, [])

  const loadLoginAttempts = async () => {
    try {
      const attempts = await authService.getLoginAttempts(100)
      setLoginAttempts(attempts)
    } catch (error) {
      console.error('Failed to load login attempts:', error)
    }
  }

  const loadUserSessions = async (userId: string) => {
    try {
      const sessions = await authService.getUserSessions()
      setUserSessions(sessions.filter(s => s.userId === userId))
    } catch (error) {
      console.error('Failed to load user sessions:', error)
    }
  }

  const handleUserStatusChange = async (userId: string, status: User['status']) => {
    setIsLoading(true)
    try {
      await authService.updateUserStatus(userId, status)
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, status, updatedAt: new Date().toISOString() } : user
      )
      onUsersChange(updatedUsers)
    } catch (error) {
      console.error('Failed to update user status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserRoleChange = async (userId: string, role: User['role']) => {
    setIsLoading(true)
    try {
      await authService.updateUserRole(userId, role)
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, role, updatedAt: new Date().toISOString() } : user
      )
      onUsersChange(updatedUsers)
    } catch (error) {
      console.error('Failed to update user role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setShowUserDialog(true)
    await loadUserSessions(user.id)
  }

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspended':
        return <Ban className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'deactivated':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-500" />
      case 'moderator':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />
      case 'user':
        return <UserCheck className="h-4 w-4 text-gray-500" />
      default:
        return <UserCheck className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      active: "default",
      suspended: "destructive",
      pending: "secondary",
      deactivated: "outline"
    } as const
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      admin: "destructive",
      moderator: "default", 
      user: "secondary"
    } as const
    
    return (
      <Badge variant={variants[role]} className="flex items-center gap-1">
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length,
    moderators: users.filter(u => u.role === 'moderator').length,
    regularUsers: users.filter(u => u.role === 'user').length,
    verifiedEmails: users.filter(u => u.emailVerified).length,
    twoFactorEnabled: users.filter(u => u.twoFactorEnabled).length
  }

  const recentSignups = users
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentLogins = users
    .filter(u => u.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced User Management</h2>
          <p className="text-muted-foreground">Comprehensive user administration and analytics</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((userStats.active / userStats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.verifiedEmails}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((userStats.verifiedEmails / userStats.total) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.twoFactorEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((userStats.twoFactorEnabled / userStats.total) * 100)}% secured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredUsers.length})</span>
                <Badge variant="outline">
                  {filteredUsers.length} of {users.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                          {user.lastLoginAt && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Last login {new Date(user.lastLoginAt).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatBytes(user.subscription.storageUsed)} / {formatBytes(user.subscription.storageLimit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2">
                        {user.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {user.twoFactorEnabled && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            2FA
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {user.subscription.plan.toUpperCase()}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}>
                            {user.status === 'active' ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Signups
                </CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSignups.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest user logins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogins.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Last login</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {user.lastLoginAt && new Date(user.lastLoginAt).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Storage Usage Analytics
              </CardTitle>
              <CardDescription>User storage consumption overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => {
                  const usage = (user.subscription.storageUsed / user.subscription.storageLimit) * 100
                  return (
                    <div key={user.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.subscription.plan}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {formatBytes(user.subscription.storageUsed)} / {formatBytes(user.subscription.storageLimit)}
                        </span>
                      </div>
                      <Progress value={usage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Overview
                </CardTitle>
                <CardDescription>System security metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">2FA Adoption</p>
                      <p className="text-sm text-muted-foreground">
                        {userStats.twoFactorEnabled} users enabled
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {Math.round((userStats.twoFactorEnabled / userStats.total) * 100)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {userStats.verifiedEmails} verified emails
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {Math.round((userStats.verifiedEmails / userStats.total) * 100)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                      <Crown className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Admin Users</p>
                      <p className="text-sm text-muted-foreground">
                        {userStats.admins} administrators
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {Math.round((userStats.admins / userStats.total) * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
                <CardDescription>Recent security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">Suspicious Login Attempt</p>
                      <p className="text-xs text-muted-foreground">
                        Multiple failed attempts from 10.0.0.1
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <ShieldX className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">Account Compromise</p>
                      <p className="text-xs text-muted-foreground">
                        User reported unauthorized access
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">2FA Enabled</p>
                      <p className="text-xs text-muted-foreground">
                        john@example.com enabled two-factor auth
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Login Attempts
              </CardTitle>
              <CardDescription>Recent authentication attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {attempt.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{attempt.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.ipAddress} • {attempt.location}
                        </p>
                        {!attempt.success && attempt.failureReason && (
                          <p className="text-xs text-red-600">{attempt.failureReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </p>
                      <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs mt-1">
                        {attempt.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="mt-1">
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email Verified</Label>
                    <div className="mt-1">
                      <Badge variant={selectedUser.emailVerified ? "default" : "secondary"}>
                        {selectedUser.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">2FA Enabled</Label>
                    <div className="mt-1">
                      <Badge variant={selectedUser.twoFactorEnabled ? "default" : "secondary"}>
                        {selectedUser.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser.profile.bio || "No bio provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser.profile.company || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser.profile.location || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Website</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser.profile.website || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Account Dates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Login</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser.lastLoginAt 
                          ? new Date(selectedUser.lastLoginAt).toLocaleString()
                          : "Never"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-semibold">{selectedUser.subscription.plan.toUpperCase()} Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Current subscription plan
                      </p>
                    </div>
                    <Badge variant="outline">
                      {selectedUser.subscription.plan}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage Used</span>
                      <span>
                        {formatBytes(selectedUser.subscription.storageUsed)} / {formatBytes(selectedUser.subscription.storageLimit)}
                      </span>
                    </div>
                    <Progress 
                      value={(selectedUser.subscription.storageUsed / selectedUser.subscription.storageLimit) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {selectedUser.subscription.features.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Features</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUser.subscription.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.subscription.expiresAt && (
                    <div>
                      <Label className="text-sm font-medium">Expires</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedUser.subscription.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-semibold">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.twoFactorEnabled ? "Enabled and active" : "Not enabled"}
                        </p>
                      </div>
                    </div>
                    <Switch checked={selectedUser.twoFactorEnabled} disabled />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">Email Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.emailVerified ? "Email address verified" : "Email not verified"}
                        </p>
                      </div>
                    </div>
                    <Switch checked={selectedUser.emailVerified} disabled />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Security Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        Force Password Change
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Verification Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Active Sessions</h4>
                  {userSessions.length > 0 ? (
                    userSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                            <Monitor className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{session.location || "Unknown Location"}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.ipAddress} • {session.userAgent.substring(0, 50)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(session.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.isActive ? "default" : "secondary"}>
                            {session.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No active sessions found.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
