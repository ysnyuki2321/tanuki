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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Database Connections</h3>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getConnectionIcon(connection.type)}</span>
                  <div>
                    <CardTitle className="text-base">{connection.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{connection.type}</p>
                  </div>
                </div>
                <Badge variant={connection.isConnected ? "default" : "secondary"}>
                  {connection.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                {connection.host && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Host:</span>
                    <span>
                      {connection.host}:{connection.port}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span>{connection.database}</span>
                </div>
                {connection.username && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span>{connection.username}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {connection.isConnected ? (
                  <Button variant="outline" size="sm" onClick={() => onDisconnect(connection.id)} className="flex-1">
                    <PlugZap className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => onConnect(connection.id)} className="flex-1">
                    <Plug className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Database className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
