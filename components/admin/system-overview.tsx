"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { SystemStats } from "@/lib/admin"
import { Users, HardDrive, Files, Server, CheckCircle } from "lucide-react"

interface SystemOverviewProps {
  stats: SystemStats
}

export function SystemOverview({ stats }: SystemOverviewProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const storageUsagePercent = (stats.usedStorage / stats.totalStorage) * 100
  const onlineNodes = stats.serverNodes.filter((node) => node.status === "online").length
  const totalNodes = stats.serverNodes.length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.activeUsers}</span> active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatBytes(stats.usedStorage)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(stats.totalStorage)} ({storageUsagePercent.toFixed(1)}%)
            </p>
            <Progress value={storageUsagePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Files</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">{stats.totalShares}</span> shared files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Server Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {onlineNodes}/{totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">nodes online</p>
          </CardContent>
        </Card>
      </div>

      {/* Server Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Server Nodes Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Real-time status of all server nodes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {stats.serverNodes.map((node) => (
              <div key={node.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      node.status === "online"
                        ? "bg-green-500"
                        : node.status === "offline"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm sm:text-base">{node.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{node.host}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <Badge
                    variant={
                      node.status === "online" ? "default" : node.status === "offline" ? "destructive" : "secondary"
                    }
                    className="text-xs"
                  >
                    {node.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{node.diskUsage}% disk used</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">System Health</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Overall system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Average CPU Usage</span>
                <span>32%</span>
              </div>
              <Progress value={32} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Average Memory Usage</span>
                <span>58%</span>
              </div>
              <Progress value={58} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Network I/O</span>
                <span>24%</span>
              </div>
              <Progress value={24} />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>All systems operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
