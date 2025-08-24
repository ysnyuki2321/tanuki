"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, HardDrive, Network, Plus, Settings, Shield } from "lucide-react"

interface StorageNode {
  id: string
  name: string
  host: string
  capacity: string
  used: string
  status: "connected" | "disconnected" | "error"
  lastSync: string
}

export function SSHStorageExpansion() {
  const mockNodes: StorageNode[] = [
    {
      id: "1",
      name: "VPS-01",
      host: "192.168.1.100",
      capacity: "500 GB",
      used: "120 GB",
      status: "connected",
      lastSync: "2 min ago"
    },
    {
      id: "2", 
      name: "VPS-02",
      host: "192.168.1.101",
      capacity: "1 TB",
      used: "450 GB",
      status: "connected",
      lastSync: "5 min ago"
    },
    {
      id: "3",
      name: "VPS-03",
      host: "192.168.1.102",
      capacity: "2 TB",
      used: "800 GB",
      status: "disconnected",
      lastSync: "1 hour ago"
    }
  ]

  const getStatusColor = (status: StorageNode["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "disconnected":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: StorageNode["status"]) => {
    switch (status) {
      case "connected":
        return "Connected"
      case "disconnected":
        return "Disconnected"
      case "error":
        return "Error"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Storage Expansion</h3>
          <p className="text-muted-foreground">
            Mount remote VPS nodes to expand your storage capacity
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">3.5 TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Network className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Nodes</p>
                <p className="text-2xl font-bold">2/3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Security</p>
                <p className="text-2xl font-bold">SSH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Node List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Connected Nodes
          </CardTitle>
          <CardDescription>
            Manage your remote storage nodes and monitor their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockNodes.map((node) => (
              <div
                key={node.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{node.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {getStatusText(node.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{node.host}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{node.used} / {node.capacity}</p>
                    <p className="text-muted-foreground">Last sync: {node.lastSync}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Network className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Secure SSH Connection</h4>
              <p className="text-sm text-muted-foreground mb-3">
                All connections are encrypted using SSH keys and secure protocols. 
                Your data remains private and secure during transmission.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">SSH Key Authentication</Badge>
                <Badge variant="outline">256-bit Encryption</Badge>
                <Badge variant="outline">Port Forwarding</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}