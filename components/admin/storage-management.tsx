"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StorageProviderManager } from "./storage-provider-manager"
import type { SystemStats } from "@/lib/admin"
import { HardDrive, Database, Archive, Trash2, RefreshCw, AlertTriangle, TrendingUp, BarChart3, Cloud, Settings } from "lucide-react"

interface StorageManagementProps {
  stats: SystemStats
}

export function StorageManagement({ stats }: StorageManagementProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const storageUsagePercent = (stats.usedStorage / stats.totalStorage) * 100
  const freeStorage = stats.totalStorage - stats.usedStorage

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Storage Management</h2>
          <p className="text-muted-foreground">Monitor and manage storage across all nodes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Total Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(stats.totalStorage)}</div>
            <p className="text-sm text-muted-foreground">Across all nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Used Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(stats.usedStorage)}</div>
            <p className="text-sm text-muted-foreground">{storageUsagePercent.toFixed(1)}% utilized</p>
            <Progress value={storageUsagePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Available</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(freeStorage)}</div>
            <p className="text-sm text-muted-foreground">Free space remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Node Storage Details */}
      <Card>
        <CardHeader>
          <CardTitle>Storage by Node</CardTitle>
          <CardDescription>Detailed storage breakdown for each server node</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.serverNodes.map((node) => {
              const nodeUsedBytes = node.diskTotal * (node.diskUsage / 100)
              const nodeFreeBytes = node.diskTotal - nodeUsedBytes

              return (
                <div key={node.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
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
                        <h3 className="font-medium">{node.name}</h3>
                        <p className="text-sm text-muted-foreground">{node.host}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {node.diskUsage > 90 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Critical
                        </Badge>
                      )}
                      {node.diskUsage > 80 && node.diskUsage <= 90 && (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                      <Badge variant="outline">{node.diskUsage}% used</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used: {formatBytes(nodeUsedBytes)}</span>
                      <span>Free: {formatBytes(nodeFreeBytes)}</span>
                      <span>Total: {formatBytes(node.diskTotal)}</span>
                    </div>
                    <Progress value={node.diskUsage} />
                  </div>

                  <div className="flex justify-end space-x-2 mt-3">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cleanup
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Storage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
            <CardDescription>Storage usage by file type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: "Images", size: 1200000000000, color: "bg-blue-500" },
              { type: "Videos", size: 800000000000, color: "bg-red-500" },
              { type: "Documents", size: 600000000000, color: "bg-green-500" },
              { type: "Archives", size: 400000000000, color: "bg-yellow-500" },
              { type: "Other", size: 200000000000, color: "bg-gray-500" },
            ].map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="font-medium">{item.type}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatBytes(item.size)}</p>
                  <p className="text-sm text-muted-foreground">{((item.size / stats.usedStorage) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Alerts</CardTitle>
            <CardDescription>Current storage warnings and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.serverNodes
              .filter((node) => node.diskUsage > 80)
              .map((node) => (
                <div key={node.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 ${node.diskUsage > 90 ? "text-red-500" : "text-yellow-500"}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {node.name} - {node.diskUsage > 90 ? "Critical" : "Warning"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Disk usage at {node.diskUsage}%. Consider cleanup or expansion.
                    </p>
                  </div>
                </div>
              ))}

            {stats.serverNodes.every((node) => node.diskUsage <= 80) && (
              <div className="text-center py-8 text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No storage alerts at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
