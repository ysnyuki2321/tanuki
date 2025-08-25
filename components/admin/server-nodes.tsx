"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  EnhancedAdminService, 
  type ServerNode, 
  type SSHCredentials, 
  type SystemOperation 
} from "@/lib/enhanced-admin"
import { 
  Terminal, 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Settings, 
  Play, 
  Square,
  X,
  Loader2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Trash2
} from "lucide-react"

interface ServerNodesProps {
  nodes: ServerNode[]
  onNodesChange?: (nodes: ServerNode[]) => void
}

export function ServerNodes({ nodes, onNodesChange }: ServerNodesProps) {
  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(null)
  const [sshCredentials, setSshCredentials] = useState<SSHCredentials>({ 
    username: "", 
    password: "", 
    privateKey: "" 
  })
  const [sshCommand, setSshCommand] = useState("")
  const [sshOutput, setSshOutput] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
  const [addingNode, setAddingNode] = useState(false)
  const [operations, setOperations] = useState<SystemOperation[]>([])
  const [newNodeForm, setNewNodeForm] = useState({
    name: "",
    host: "",
    port: "22",
    username: "",
    password: "",
    privateKey: "",
    tags: "",
    region: "",
    provider: ""
  })

  const adminService = EnhancedAdminService.getInstance()

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSSHConnect = async () => {
    if (!selectedNode) return

    setIsConnecting(true)
    try {
      const result = await adminService.testSSHConnection(selectedNode.host, selectedNode.port, sshCredentials)
      if (result.success) {
        setSshOutput(
          (prev) =>
            prev + `\n[${new Date().toLocaleTimeString()}] ✅ Connected to ${selectedNode.name} (${selectedNode.host})`,
        )
        // Update node status
        const updatedNodes = nodes.map(node => 
          node.id === selectedNode.id 
            ? { ...node, sshConnected: true, status: 'online' as const }
            : node
        )
        onNodesChange?.(updatedNodes)
      } else {
        setSshOutput(
          (prev) => prev + `\n[${new Date().toLocaleTimeString()}] ❌ Failed to connect: ${result.error}`,
        )
      }
    } catch (error) {
      setSshOutput((prev) => prev + `\n[${new Date().toLocaleTimeString()}] Connection error: ${error}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSSHCommand = async () => {
    if (!selectedNode || !sshCommand.trim()) return

    setIsExecuting(true)
    try {
      // Simulate SSH command execution for now
      const output = `Command executed: ${sshCommand}\nResult: Success (simulated)`
      setSshOutput((prev) => prev + `\n[${new Date().toLocaleTimeString()}] $ ${sshCommand}\n${output}`)
      setSshCommand("")
    } catch (error) {
      setSshOutput((prev) => prev + `\n[${new Date().toLocaleTimeString()}] Command failed: ${error}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleAddNode = async () => {
    setAddingNode(true)
    try {
      const credentials: SSHCredentials = {
        username: newNodeForm.username,
        password: newNodeForm.password,
        privateKey: newNodeForm.privateKey
      }

      const result = await adminService.addServerNode({
        name: newNodeForm.name,
        host: newNodeForm.host,
        port: parseInt(newNodeForm.port),
        credentials,
        tags: newNodeForm.tags ? newNodeForm.tags.split(',').map(t => t.trim()) : [],
        region: newNodeForm.region || 'unknown',
        provider: newNodeForm.provider || 'unknown'
      })

      if (result.success && result.node) {
        const updatedNodes = [...nodes, result.node]
        onNodesChange?.(updatedNodes)
        setShowAddNodeDialog(false)
        resetAddNodeForm()
      } else {
        console.error('Failed to add node:', result.error)
      }
    } catch (error) {
      console.error('Error adding node:', error)
    } finally {
      setAddingNode(false)
    }
  }

  const handleRemoveNode = async (nodeId: string) => {
    try {
      const success = await adminService.removeServerNode(nodeId)
      if (success) {
        const updatedNodes = nodes.filter(node => node.id !== nodeId)
        onNodesChange?.(updatedNodes)
      }
    } catch (error) {
      console.error('Error removing node:', error)
    }
  }

  const resetAddNodeForm = () => {
    setNewNodeForm({
      name: "",
      host: "",
      port: "22",
      username: "",
      password: "",
      privateKey: "",
      tags: "",
      region: "",
      provider: ""
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Server Nodes</h2>
          <p className="text-muted-foreground">Manage and monitor your server infrastructure</p>
        </div>
        <Dialog open={showAddNodeDialog} onOpenChange={setShowAddNodeDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Server Node</DialogTitle>
              <DialogDescription>
                Add a new server node to your infrastructure
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeName">Name</Label>
                  <Input
                    id="nodeName"
                    value={newNodeForm.name}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Production Server 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeHost">Host</Label>
                  <Input
                    id="nodeHost"
                    value={newNodeForm.host}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodePort">Port</Label>
                  <Input
                    id="nodePort"
                    type="number"
                    value={newNodeForm.port}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="22"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeRegion">Region</Label>
                  <Input
                    id="nodeRegion"
                    value={newNodeForm.region}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="us-east-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeProvider">Provider</Label>
                  <Input
                    id="nodeProvider"
                    value={newNodeForm.provider}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="aws, gcp, azure"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeUsername">SSH Username</Label>
                  <Input
                    id="nodeUsername"
                    value={newNodeForm.username}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="root"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodePassword">SSH Password</Label>
                  <Input
                    id="nodePassword"
                    type="password"
                    value={newNodeForm.password}
                    onChange={(e) => setNewNodeForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Password or leave empty for key auth"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nodeTags">Tags (comma-separated)</Label>
                <Input
                  id="nodeTags"
                  value={newNodeForm.tags}
                  onChange={(e) => setNewNodeForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="production, primary, web-server"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddNodeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNode} disabled={addingNode || !newNodeForm.name || !newNodeForm.host || !newNodeForm.username}>
                {addingNode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Add Node</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>{node.name}</span>
                </CardTitle>
                <Badge
                  variant={
                    node.status === "online" ? "default" : 
                    node.status === "offline" ? "destructive" : 
                    "secondary"
                  }
                >
                  {node.status}
                </Badge>
              </div>
              <CardDescription>{node.host}:{node.port}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resource Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4" />
                    <span>Disk Usage</span>
                  </div>
                  <span>{node.diskUsage}%</span>
                </div>
                <Progress value={node.diskUsage} />
                <p className="text-xs text-muted-foreground">
                  {formatBytes(node.diskTotal * (node.diskUsage / 100))} / {formatBytes(node.diskTotal)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-sm">
                    <Cpu className="h-3 w-3" />
                    <span>CPU</span>
                  </div>
                  <div className="text-lg font-semibold">{node.cpu}%</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-sm">
                    <MemoryStick className="h-3 w-3" />
                    <span>Memory</span>
                  </div>
                  <div className="text-lg font-semibold">{node.memory}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last ping: {new Date(node.lastPing).toLocaleTimeString()}</span>
                <div className="flex space-x-1">
                  {node.sshEnabled && (
                    <Badge variant="outline" className="text-xs">
                      SSH Enabled
                    </Badge>
                  )}
                  {node.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {node.tags[0]}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show disk info or placeholder */}
              {node.mountPoints.length === 0 ? (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No disks configured</p>
                  <p className="text-xs text-muted-foreground">Connect via SSH to discover disks</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium">Mount Points:</p>
                  {node.mountPoints.slice(0, 2).map((disk) => (
                    <div key={disk.id} className="text-xs flex justify-between">
                      <span className="text-muted-foreground">{disk.mountPoint || disk.path}</span>
                      <span>{formatBytes(disk.used)} / {formatBytes(disk.size)}</span>
                    </div>
                  ))}
                  {node.mountPoints.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{node.mountPoints.length - 2} more</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      disabled={!node.sshEnabled || node.status !== "online"}
                      onClick={() => setSelectedNode(node)}
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      SSH
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>SSH Terminal - {node.name}</DialogTitle>
                      <DialogDescription>Connect and execute commands on {node.host}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Connection Panel */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Connection</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={sshCredentials.username}
                              onChange={(e) => setSshCredentials((prev) => ({ ...prev, username: e.target.value }))}
                              placeholder="root"
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={sshCredentials.password}
                              onChange={(e) => setSshCredentials((prev) => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                          <Button
                            onClick={handleSSHConnect}
                            disabled={isConnecting || !sshCredentials.username}
                            className="w-full"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Quick Commands */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Quick Commands</h4>
                          <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSshCommand("df -h")}>
                              Check Disk Usage
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSshCommand("free -h")}>
                              Check Memory
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSshCommand("uptime")}>
                              System Uptime
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Terminal Panel */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Terminal</h3>
                        <Textarea
                          value={sshOutput}
                          readOnly
                          className="font-mono text-sm min-h-[300px] bg-black text-green-400"
                          placeholder="SSH output will appear here..."
                        />
                        <div className="flex space-x-2">
                          <Input
                            value={sshCommand}
                            onChange={(e) => setSshCommand(e.target.value)}
                            placeholder="Enter command..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSSHCommand()
                              }
                            }}
                            className="font-mono"
                          />
                          <Button onClick={handleSSHCommand} disabled={isExecuting || !sshCommand.trim()}>
                            {isExecuting ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveNode(node.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
