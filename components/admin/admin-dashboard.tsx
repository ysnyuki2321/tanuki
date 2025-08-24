"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminService, type SystemStats, type User } from "@/lib/admin"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { SystemOverview } from "./system-overview"
import { UserManagement } from "./user-management"
import { ServerNodes } from "./server-nodes"
import { StorageManagement } from "./storage-management"

export function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([AdminService.getSystemStats(), AdminService.getUsers()])
        setStats(statsData)
        setUsers(usersData)
      } catch (error) {
        console.error("[v0] Failed to load admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Failed to Load Admin Data</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your Tanuki storage platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs sm:text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
          <TabsTrigger value="servers" className="text-xs sm:text-sm">Servers</TabsTrigger>
          <TabsTrigger value="storage" className="text-xs sm:text-sm">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverview stats={stats} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement users={users} onUsersChange={setUsers} />
        </TabsContent>

        <TabsContent value="servers">
          <ServerNodes nodes={stats.serverNodes} />
        </TabsContent>

        <TabsContent value="storage">
          <StorageManagement stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
