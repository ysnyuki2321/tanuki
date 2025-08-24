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
import { AdminService, type ServerNode } from "@/lib/admin"
import { Terminal, Server, HardDrive, Cpu, MemoryStick, Settings, Play, Square } from "lucide-react"

interface ServerNodesProps {
  nodes: ServerNode[]
}

export function ServerNodes({ nodes }: ServerNodesProps) {
  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(null)
  const [sshCredentials, setSshCredentials] = useState({ username: "", password: "", privateKey: "" })
  const [sshCommand, setSshCommand] = useState("")
  const [sshOutput, setSshOutput] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

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
      const success = await AdminService.connectSSH(selectedNode.id, sshCredentials)
      if (success) {
        setSshOutput(
          (prev) =>
            prev + `\n[${new Date().toLocaleTimeString()}] Connected to ${selectedNode.name} (${selectedNode.host})`,
        )
      } else {
        setSshOutput(
          (prev) => prev + `\n[${new Date().toLocaleTimeString()}] Failed to connect to ${selectedNode.name}`,
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
      const output = await AdminService.executeSSHCommand(selectedNode.id, sshCommand)
      setSshOutput((prev) => prev + `\n[${new Date().toLocaleTimeString()}] $ ${sshCommand}\n${output}`)
      setSshCommand("")
    } catch (error) {
      setSshOutput((prev) => prev + `\n[${new Date().toLocaleTimeString()}] Command failed: ${error}`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Server Nodes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and monitor your server infrastructure</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Server className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Node</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Server className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{node.name}</span>
                </CardTitle>
                <Badge
                  variant={
                    node.status === "online" ? "default" : node.status === "offline" ? "destructive" : "secondary"
                  }
                >
                  {node.status}
                </Badge>
              </div>
              <CardDescription>{node.host}</CardDescription>
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
                {node.sshEnabled && (
                  <Badge variant="outline" className="text-xs">
                    SSH Enabled
                  </Badge>
                )}
              </div>

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
                            {isConnecting ? "Connecting..." : "Connect"}
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

                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
