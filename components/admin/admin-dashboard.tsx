"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedAdminService, type SystemStats, type User } from "@/lib/enhanced-admin"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { SystemOverview } from "./system-overview"
import { AdvancedUserManagement } from "./advanced-user-management"
import { ServerNodes } from "./server-nodes"
import { StorageManagement } from "./storage-management"
import { SSHManagement } from "./ssh-management"
import { NotificationManagement } from "./notification-management"
import { MonitoringDashboard } from "./monitoring-dashboard"
import { EmailVerificationManagement } from "./email-verification-management"
import { BrandingManagement } from "./branding-management"

export function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const adminService = EnhancedAdminService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, usersData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getUsers()
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (error) {
      console.error("[Enhanced Admin] Failed to load admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Admin Data</h2>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Tanuki storage platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="ssh">SSH</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email Config</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverview stats={stats} />
        </TabsContent>

        <TabsContent value="users">
          <AdvancedUserManagement users={users} onUsersChange={setUsers} />
        </TabsContent>

        <TabsContent value="servers">
          <ServerNodes
            nodes={stats?.serverNodes || []}
            onNodesChange={(nodes) => {
              if (stats) {
                setStats(prev => prev ? { ...prev, serverNodes: nodes } : null)
              }
            }}
          />
        </TabsContent>

        <TabsContent value="ssh">
          <SSHManagement
            nodes={stats?.serverNodes || []}
            onNodesChange={(nodes) => setStats(prev => prev ? { ...prev, serverNodes: nodes } : null)}
          />
        </TabsContent>

        <TabsContent value="monitoring">
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationManagement />
        </TabsContent>

        <TabsContent value="email">
          <EmailVerificationManagement />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingManagement />
        </TabsContent>

        <TabsContent value="storage">
          <StorageManagement stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
