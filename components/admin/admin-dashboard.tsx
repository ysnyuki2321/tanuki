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
import { SSHManagement } from "./ssh-management"

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="ssh">SSH</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
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

        <TabsContent value="ssh">
          <SSHManagement
            nodes={stats.serverNodes}
            onNodesChange={(nodes) => setStats(prev => prev ? { ...prev, serverNodes: nodes } : null)}
          />
        </TabsContent>

        <TabsContent value="storage">
          <StorageManagement stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
