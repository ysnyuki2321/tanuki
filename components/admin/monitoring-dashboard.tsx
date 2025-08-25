"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { MonitoringService, type SystemMetrics, type ServiceStatus, type Alert, type SystemHealth } from "@/lib/monitoring"
import { formatBytes } from "@/lib/utils"
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Shield,
  Database,
  Wifi,
  Monitor,
  Zap,
  AlertCircle,
  Info,
  Ban
} from "lucide-react"

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'5m' | '1h' | '6h' | '24h'>('5m')

  const monitoringService = MonitoringService.getInstance()

  useEffect(() => {
    // Load initial data
    loadData()

    // Start monitoring
    monitoringService.startMonitoring()
    setIsMonitoring(true)

    // Set up auto-refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData()
      }
    }, 5000) // Refresh every 5 seconds

    return () => {
      clearInterval(interval)
      monitoringService.stopMonitoring()
    }
  }, [autoRefresh])

  const loadData = () => {
    const currentMetrics = monitoringService.getCurrentMetrics()
    const history = monitoringService.getMetricsHistory(50)
    const serviceList = monitoringService.getServices()
    const alertList = monitoringService.getAlerts()
    const health = monitoringService.getSystemHealth()

    setMetrics(currentMetrics)
    setMetricsHistory(history)
    setServices(serviceList)
    setAlerts(alertList)
    setSystemHealth(health)
  }

  const handleServiceAction = async (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      switch (action) {
        case 'start':
          await monitoringService.startService(serviceId)
          break
        case 'stop':
          await monitoringService.stopService(serviceId)
          break
        case 'restart':
          await monitoringService.restartService(serviceId)
          break
      }
      loadData()
    } catch (error) {
      console.error(`Failed to ${action} service:`, error)
    }
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    monitoringService.acknowledgeAlert(alertId, 'admin-user')
    loadData()
  }

  const getServiceStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'stopped':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'starting':
      case 'stopping':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getServiceStatusBadge = (status: ServiceStatus['status']) => {
    const variants = {
      running: "default",
      stopped: "destructive", 
      error: "destructive",
      starting: "secondary",
      stopping: "secondary"
    } as const

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getServiceStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertBadge = (severity: Alert['severity']) => {
    const variants = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary"
    } as const

    return (
      <Badge variant={variants[severity]} className="flex items-center gap-1">
        {getAlertIcon(severity)}
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    )
  }

  const getHealthIcon = (status: SystemHealth['overall']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const formatUptime = (uptimeMs: number) => {
    const uptime = Date.now() - uptimeMs
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000))
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
          <p className="text-muted-foreground">System health, performance metrics, and service monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
          </div>
          <Button variant="outline" onClick={loadData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon(systemHealth.overall)}
              System Health
              <Badge variant={systemHealth.overall === 'healthy' ? 'default' : 'destructive'}>
                Score: {systemHealth.score}/100
              </Badge>
            </CardTitle>
            <CardDescription>
              Overall system health and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <Database className={`h-8 w-8 mx-auto mb-2 ${
                  systemHealth.checks.database === 'healthy' ? 'text-green-500' :
                  systemHealth.checks.database === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground capitalize">{systemHealth.checks.database}</p>
              </div>
              <div className="text-center">
                <HardDrive className={`h-8 w-8 mx-auto mb-2 ${
                  systemHealth.checks.storage === 'healthy' ? 'text-green-500' :
                  systemHealth.checks.storage === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground capitalize">{systemHealth.checks.storage}</p>
              </div>
              <div className="text-center">
                <Wifi className={`h-8 w-8 mx-auto mb-2 ${
                  systemHealth.checks.network === 'healthy' ? 'text-green-500' :
                  systemHealth.checks.network === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="text-sm font-medium">Network</p>
                <p className="text-xs text-muted-foreground capitalize">{systemHealth.checks.network}</p>
              </div>
              <div className="text-center">
                <Server className={`h-8 w-8 mx-auto mb-2 ${
                  systemHealth.checks.services === 'healthy' ? 'text-green-500' :
                  systemHealth.checks.services === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="text-sm font-medium">Services</p>
                <p className="text-xs text-muted-foreground capitalize">{systemHealth.checks.services}</p>
              </div>
              <div className="text-center">
                <Shield className={`h-8 w-8 mx-auto mb-2 ${
                  systemHealth.checks.security === 'healthy' ? 'text-green-500' :
                  systemHealth.checks.security === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-muted-foreground capitalize">{systemHealth.checks.security}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Health Score</span>
                <span>{systemHealth.score}/100</span>
              </div>
              <Progress value={systemHealth.score} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Uptime: {formatUptime(systemHealth.uptime)}</span>
                <span>Last Check: {new Date(systemHealth.lastCheck).toLocaleTimeString()}</span>
              </div>
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CPU Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
                  <div className="mt-2">
                    <Progress value={metrics.cpu.usage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.cpu.cores} cores • Load: {metrics.cpu.load.map(l => l.toFixed(2)).join(', ')}
                  </p>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.memory.percentage.toFixed(1)}%</div>
                  <div className="mt-2">
                    <Progress value={metrics.memory.percentage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
                  </p>
                </CardContent>
              </Card>

              {/* Disk Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.disk.percentage.toFixed(1)}%</div>
                  <div className="mt-2">
                    <Progress value={metrics.disk.percentage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}
                  </p>
                </CardContent>
              </Card>

              {/* Network Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        In
                      </span>
                      <span>{formatBytes(metrics.network.bytesIn)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-blue-500" />
                        Out
                      </span>
                      <span>{formatBytes(metrics.network.bytesOut)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Packets: {metrics.network.packetsIn.toLocaleString()} in, {metrics.network.packetsOut.toLocaleString()} out
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Process Information */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Process Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.processes.total}</div>
                    <p className="text-sm text-muted-foreground">Total Processes</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.processes.active}</div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{metrics.processes.sleeping}</div>
                    <p className="text-sm text-muted-foreground">Sleeping</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        <Server className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{service.name}</h3>
                          {getServiceStatusBadge(service.status)}
                          {service.health.healthy ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Healthy
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unhealthy
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>CPU: {service.cpu.toFixed(1)}%</span>
                          <span>Memory: {formatBytes(service.memory * 1024 * 1024)}</span>
                          <span>Uptime: {formatUptime(service.uptime)}</span>
                          {service.port && <span>Port: {service.port}</span>}
                          {service.pid && <span>PID: {service.pid}</span>}
                        </div>
                        {service.health.responseTime && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Response Time: {service.health.responseTime.toFixed(0)}ms
                          </div>
                        )}
                        {service.restarts > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Restarts: {service.restarts} {service.lastRestart && `(Last: ${new Date(service.lastRestart).toLocaleString()})`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {service.status === 'running' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceAction(service.id, 'restart')}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceAction(service.id, 'stop')}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {service.status === 'stopped' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleServiceAction(service.id, 'start')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">System Alerts</h3>
              <p className="text-sm text-muted-foreground">
                {activeAlerts.length} active alerts
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Alert Rules
            </Button>
          </div>

          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.slice(0, 20).map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{alert.ruleName}</h4>
                            {getAlertBadge(alert.severity)}
                            <Badge variant={
                              alert.status === 'active' ? 'destructive' :
                              alert.status === 'acknowledged' ? 'default' : 'secondary'
                            }>
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
                            {alert.resolvedAt && (
                              <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                            )}
                            {alert.acknowledgedAt && alert.acknowledgedBy && (
                              <span>Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">All systems are operating normally</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Historical performance data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Performance Charts</h3>
                  <p className="text-muted-foreground">
                    Historical performance charts and analytics would be displayed here
                  </p>
                </div>
                
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Average Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">127ms</div>
                      <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Request Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">99.7%</div>
                      <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">45.2K</div>
                      <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
