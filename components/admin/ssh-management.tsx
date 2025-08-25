"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminService, type ServerNode, type SSHCredentials, type DiskMount } from "@/lib/admin"
import { 
  Server, 
  Plus, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Settings, 
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface SSHManagementProps {
  nodes: ServerNode[]
  onNodesChange: (nodes: ServerNode[]) => void
}

export function SSHManagement({ nodes, onNodesChange }: SSHManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState("")
  const [newNodeForm, setNewNodeForm] = useState({
    name: "",
    host: "",
    port: "22",
    username: "",
    password: "",
    privateKey: "",
    passphrase: ""
  })
  const [discoveredDisks, setDiscoveredDisks] = useState<{[nodeId: string]: DiskMount[]}>({})

  const handleAddServer = async () => {
    if (!newNodeForm.name || !newNodeForm.host || !newNodeForm.username) {
      setConnectionError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    setIsConnecting(true)
    setConnectionError("")

    try {
      const credentials: SSHCredentials = {
        username: newNodeForm.username,
        password: newNodeForm.password || undefined,
        privateKey: newNodeForm.privateKey || undefined,
        passphrase: newNodeForm.passphrase || undefined
      }

      const newNode = await AdminService.addServerNode(
        newNodeForm.name,
        newNodeForm.host,
        parseInt(newNodeForm.port),
        credentials
      )

      if (newNode) {
        onNodesChange([...nodes, newNode])
        setShowAddDialog(false)
        setNewNodeForm({
          name: "",
          host: "",
          port: "22",
          username: "",
          password: "",
          privateKey: "",
          passphrase: ""
        })
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Không thể kết nối đến server")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDiscoverDisks = async (nodeId: string) => {
    setIsDiscovering(nodeId)
    try {
      const result = await AdminService.discoverDisks(nodeId)
      if (result.success) {
        setDiscoveredDisks(prev => ({
          ...prev,
          [nodeId]: result.disks
        }))
      }
    } catch (error) {
      console.error("Failed to discover disks:", error)
    } finally {
      setIsDiscovering(null)
    }
  }

  const handleConnectSSH = async (nodeId: string, credentials: SSHCredentials) => {
    try {
      const result = await AdminService.connectSSH(nodeId, credentials)
      if (result.success) {
        const updatedNodes = nodes.map(node => 
          node.id === nodeId 
            ? { ...node, sshConnected: true, status: "online" as const }
            : node
        )
        onNodesChange(updatedNodes)
        await handleDiscoverDisks(nodeId)
      }
    } catch (error) {
      console.error("SSH connection failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SSH Server Management</h2>
          <p className="text-muted-foreground">Quản lý các server SSH và khám phá ổ đĩa</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Server
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Thêm Server SSH</DialogTitle>
              <DialogDescription>
                Kết nối đến server SSH mới để mở rộng storage
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên server *</Label>
                  <Input
                    id="name"
                    value={newNodeForm.name}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Primary Server"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">Địa chỉ IP/Domain *</Label>
                  <Input
                    id="host"
                    value={newNodeForm.host}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Cổng SSH</Label>
                  <Input
                    id="port"
                    type="number"
                    value={newNodeForm.port}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="22"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newNodeForm.username}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="root"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                >
                  {showPasswordFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswordFields ? "Ẩn" : "Hiện"} xác thực
                </Button>
              </div>

              {showPasswordFields && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newNodeForm.password}
                      onChange={(e) => setNewNodeForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Để trống nếu dùng SSH key"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="privateKey">SSH Private Key</Label>
                    <Textarea
                      id="privateKey"
                      value={newNodeForm.privateKey}
                      onChange={(e) => setNewNodeForm(prev => ({ ...prev, privateKey: e.target.value }))}
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                  
                  {newNodeForm.privateKey && (
                    <div className="space-y-2">
                      <Label htmlFor="passphrase">Passphrase (nếu có)</Label>
                      <Input
                        id="passphrase"
                        type="password"
                        value={newNodeForm.passphrase}
                        onChange={(e) => setNewNodeForm(prev => ({ ...prev, passphrase: e.target.value }))}
                        placeholder="Passphrase cho private key"
                      />
                    </div>
                  )}
                </div>
              )}

              {connectionError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddServer} disabled={isConnecting}>
                {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isConnecting ? "Đang kết nối..." : "Thêm Server"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className="h-6 w-6" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{node.name}</span>
                      <Badge variant={node.status === "online" ? "default" : "secondary"}>
                        {node.status}
                      </Badge>
                      {node.sshConnected ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {node.host}:{node.port} • SSH {node.sshEnabled ? "Enabled" : "Disabled"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!node.sshConnected && node.credentials && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConnectSSH(node.id, node.credentials!)}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Kết nối SSH
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDiscoverDisks(node.id)}
                    disabled={!node.sshConnected || isDiscovering === node.id}
                  >
                    {isDiscovering === node.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Khám phá ổ đĩa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CPU</p>
                  <p className="text-lg font-semibold">{node.cpu}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Memory</p>
                  <p className="text-lg font-semibold">{node.memory}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Disk Usage</p>
                  <p className="text-lg font-semibold">{node.diskUsage}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Storage</p>
                  <p className="text-lg font-semibold">{formatBytes(node.diskTotal)}</p>
                </div>
              </div>

              {/* Mount Points */}
              {node.mountPoints && node.mountPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Mounted Disks
                  </h4>
                  <div className="grid gap-2">
                    {node.mountPoints.map((mount) => (
                      <div key={mount.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <HardDrive className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{mount.path}</p>
                            <p className="text-sm text-muted-foreground">
                              {mount.mountPoint} • {mount.filesystem}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatBytes(mount.used)} / {formatBytes(mount.size)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((mount.used / mount.size) * 100)}% used
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discovered Disks */}
              {discoveredDisks[node.id] && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Available Disks
                  </h4>
                  <div className="grid gap-2">
                    {discoveredDisks[node.id]
                      .filter(disk => !disk.mountPoint)
                      .map((disk) => (
                      <div key={disk.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <HardDrive className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{disk.path}</p>
                            <p className="text-sm text-muted-foreground">
                              {disk.filesystem} • {formatBytes(disk.size)} available
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mount
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
