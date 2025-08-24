"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DatabaseConnection } from "@/lib/database"
import { Database, Plug, PlugZap, Plus } from "lucide-react"

interface DatabaseConnectionsProps {
  connections: DatabaseConnection[]
  onConnect: (connectionId: string) => void
  onDisconnect: (connectionId: string) => void
}

export function DatabaseConnections({ connections, onConnect, onDisconnect }: DatabaseConnectionsProps) {
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "postgresql":
        return "🐘"
      case "mysql":
        return "🐬"
      case "sqlite":
        return "📁"
      case "mongodb":
        return "🍃"
      default:
        return "🗃️"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Database Connections</h3>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{getConnectionIcon(connection.type)}</span>
                  <div>
                    <CardTitle className="text-base">{connection.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{connection.type}</p>
                  </div>
                </div>
                <Badge variant={connection.isConnected ? "default" : "secondary"} className="w-fit">
                  {connection.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-1 text-xs sm:text-sm">
                {connection.host && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="truncate ml-2">
                      {connection.host}:{connection.port}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="truncate ml-2">{connection.database}</span>
                </div>
                {connection.username && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="truncate ml-2">{connection.username}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {connection.isConnected ? (
                  <Button variant="outline" size="sm" onClick={() => onDisconnect(connection.id)} className="flex-1 text-xs">
                    <PlugZap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Disconnect</span>
                    <span className="sm:hidden">Disconn</span>
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => onConnect(connection.id)} className="flex-1 text-xs">
                    <Plug className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Connect</span>
                    <span className="sm:hidden">Conn</span>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-xs">
                  <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
