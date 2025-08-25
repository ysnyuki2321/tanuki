export interface SystemMetrics {
  timestamp: string
  cpu: {
    usage: number
    cores: number
    load: number[]
  }
  memory: {
    used: number
    total: number
    available: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    available: number
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
  }
  processes: {
    total: number
    active: number
    sleeping: number
  }
}

export interface ServiceStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping'
  uptime: number
  cpu: number
  memory: number
  port?: number
  pid?: number
  restarts: number
  lastRestart?: string
  health: {
    healthy: boolean
    responseTime?: number
    lastCheck: string
    errors: string[]
  }
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals'
  threshold: number
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  notifications: {
    email: boolean
    slack: boolean
    webhook?: string
  }
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  metric: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'acknowledged'
  triggeredAt: string
  resolvedAt?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  message: string
}

export interface PerformanceLog {
  id: string
  timestamp: string
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  userAgent: string
  ipAddress: string
  userId?: string
  errorMessage?: string
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  score: number // 0-100
  checks: {
    database: 'healthy' | 'warning' | 'error'
    storage: 'healthy' | 'warning' | 'error'
    network: 'healthy' | 'warning' | 'error'
    services: 'healthy' | 'warning' | 'error'
    security: 'healthy' | 'warning' | 'error'
  }
  lastCheck: string
  uptime: number
}

// Mock monitoring service
export class MonitoringService {
  private static instance: MonitoringService
  private metrics: SystemMetrics[] = []
  private services: ServiceStatus[] = []
  private alerts: Alert[] = []
  private alertRules: AlertRule[] = []
  private performanceLogs: PerformanceLog[] = []
  private isRunning = false
  private intervalId?: NodeJS.Timeout

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
      MonitoringService.instance.initializeDefaultData()
    }
    return MonitoringService.instance
  }

  private initializeDefaultData() {
    // Initialize default services
    this.services = [
      {
        id: 'web-server',
        name: 'Web Server (Next.js)',
        status: 'running',
        uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours
        cpu: 15.2,
        memory: 256.8,
        port: 3000,
        pid: 1234,
        restarts: 0,
        health: {
          healthy: true,
          responseTime: 45,
          lastCheck: new Date().toISOString(),
          errors: []
        }
      },
      {
        id: 'database',
        name: 'PostgreSQL Database',
        status: 'running',
        uptime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days
        cpu: 8.5,
        memory: 512.3,
        port: 5432,
        pid: 5678,
        restarts: 1,
        lastRestart: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(),
        health: {
          healthy: true,
          responseTime: 12,
          lastCheck: new Date().toISOString(),
          errors: []
        }
      },
      {
        id: 'file-storage',
        name: 'File Storage Service',
        status: 'running',
        uptime: Date.now() - (12 * 60 * 60 * 1000), // 12 hours
        cpu: 3.1,
        memory: 128.4,
        restarts: 0,
        health: {
          healthy: true,
          lastCheck: new Date().toISOString(),
          errors: []
        }
      },
      {
        id: 'email-service',
        name: 'SMTP Email Service',
        status: 'running',
        uptime: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days
        cpu: 1.2,
        memory: 64.7,
        restarts: 2,
        lastRestart: new Date(Date.now() - (6 * 60 * 60 * 1000)).toISOString(),
        health: {
          healthy: true,
          responseTime: 890,
          lastCheck: new Date().toISOString(),
          errors: []
        }
      }
    ]

    // Initialize default alert rules
    this.alertRules = [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        condition: 'greater_than',
        threshold: 80,
        duration: 300, // 5 minutes
        severity: 'high',
        enabled: true,
        notifications: {
          email: true,
          slack: false
        }
      },
      {
        id: 'memory-high',
        name: 'High Memory Usage',
        metric: 'memory.percentage',
        condition: 'greater_than',
        threshold: 85,
        duration: 180, // 3 minutes
        severity: 'high',
        enabled: true,
        notifications: {
          email: true,
          slack: true
        }
      },
      {
        id: 'disk-full',
        name: 'Disk Space Critical',
        metric: 'disk.percentage',
        condition: 'greater_than',
        threshold: 90,
        duration: 60, // 1 minute
        severity: 'critical',
        enabled: true,
        notifications: {
          email: true,
          slack: true,
          webhook: 'https://hooks.slack.com/webhook'
        }
      },
      {
        id: 'service-down',
        name: 'Service Down',
        metric: 'service.status',
        condition: 'equals',
        threshold: 0, // 0 = down
        duration: 30, // 30 seconds
        severity: 'critical',
        enabled: true,
        notifications: {
          email: true,
          slack: true
        }
      }
    ]

    // Generate initial metrics
    this.generateMetrics()
  }

  private generateMetrics() {
    const now = new Date()
    
    // Generate realistic system metrics
    const metrics: SystemMetrics = {
      timestamp: now.toISOString(),
      cpu: {
        usage: Math.random() * 50 + 10, // 10-60%
        cores: 8,
        load: [
          Math.random() * 2,
          Math.random() * 2,
          Math.random() * 2
        ]
      },
      memory: {
        used: Math.random() * 8000000000 + 2000000000, // 2-10GB
        total: 16000000000, // 16GB
        available: 0,
        percentage: 0
      },
      disk: {
        used: Math.random() * 500000000000 + 100000000000, // 100-600GB
        total: 1000000000000, // 1TB
        available: 0,
        percentage: 0
      },
      network: {
        bytesIn: Math.random() * 1000000000,
        bytesOut: Math.random() * 1000000000,
        packetsIn: Math.random() * 1000000,
        packetsOut: Math.random() * 1000000
      },
      processes: {
        total: Math.floor(Math.random() * 200) + 150,
        active: Math.floor(Math.random() * 50) + 20,
        sleeping: Math.floor(Math.random() * 150) + 100
      }
    }

    // Calculate derived values
    metrics.memory.available = metrics.memory.total - metrics.memory.used
    metrics.memory.percentage = (metrics.memory.used / metrics.memory.total) * 100

    metrics.disk.available = metrics.disk.total - metrics.disk.used
    metrics.disk.percentage = (metrics.disk.used / metrics.disk.total) * 100

    this.metrics.push(metrics)

    // Keep only last 100 metrics (last ~8 minutes if collected every 5s)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  private updateServices() {
    this.services = this.services.map(service => {
      // Randomly update CPU and memory usage
      const cpuVariation = (Math.random() - 0.5) * 2 // ±1%
      const memoryVariation = (Math.random() - 0.5) * 10 // ±5MB

      return {
        ...service,
        cpu: Math.max(0, Math.min(100, service.cpu + cpuVariation)),
        memory: Math.max(0, service.memory + memoryVariation),
        health: {
          ...service.health,
          responseTime: service.health.responseTime ? 
            Math.max(1, service.health.responseTime + (Math.random() - 0.5) * 10) : 
            undefined,
          lastCheck: new Date().toISOString()
        }
      }
    })
  }

  private checkAlerts() {
    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) return

    this.alertRules.filter(rule => rule.enabled).forEach(rule => {
      let value: number
      let shouldTrigger = false

      switch (rule.metric) {
        case 'cpu.usage':
          value = latestMetrics.cpu.usage
          break
        case 'memory.percentage':
          value = latestMetrics.memory.percentage
          break
        case 'disk.percentage':
          value = latestMetrics.disk.percentage
          break
        default:
          return
      }

      switch (rule.condition) {
        case 'greater_than':
          shouldTrigger = value > rule.threshold
          break
        case 'less_than':
          shouldTrigger = value < rule.threshold
          break
        case 'equals':
          shouldTrigger = Math.abs(value - rule.threshold) < 0.1
          break
      }

      const existingAlert = this.alerts.find(
        alert => alert.ruleId === rule.id && alert.status === 'active'
      )

      if (shouldTrigger && !existingAlert) {
        // Trigger new alert
        const alert: Alert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
          status: 'active',
          triggeredAt: new Date().toISOString(),
          message: `${rule.name}: ${rule.metric} is ${value.toFixed(1)} (threshold: ${rule.threshold})`
        }
        this.alerts.push(alert)
      } else if (!shouldTrigger && existingAlert) {
        // Resolve existing alert
        existingAlert.status = 'resolved'
        existingAlert.resolvedAt = new Date().toISOString()
      }
    })
  }

  private logPerformance() {
    // Generate random performance logs
    const endpoints = ['/api/files', '/api/users', '/api/database', '/api/auth']
    const methods = ['GET', 'POST', 'PUT', 'DELETE']
    const statusCodes = [200, 201, 400, 404, 500]

    if (Math.random() < 0.3) { // 30% chance to generate a log
      const log: PerformanceLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        responseTime: Math.random() * 1000 + 10,
        statusCode: statusCodes[Math.floor(Math.random() * statusCodes.length)],
        userAgent: 'Mozilla/5.0 (compatible)',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 1000)}` : undefined
      }

      this.performanceLogs.push(log)

      // Keep only last 1000 logs
      if (this.performanceLogs.length > 1000) {
        this.performanceLogs = this.performanceLogs.slice(-1000)
      }
    }
  }

  startMonitoring() {
    if (this.isRunning) return

    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.generateMetrics()
      this.updateServices()
      this.checkAlerts()
      this.logPerformance()
    }, 5000) // Every 5 seconds
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.isRunning = false
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  getMetricsHistory(limit = 50): SystemMetrics[] {
    return this.metrics.slice(-limit)
  }

  getServices(): ServiceStatus[] {
    return [...this.services]
  }

  getServiceById(id: string): ServiceStatus | null {
    return this.services.find(s => s.id === id) || null
  }

  async restartService(id: string): Promise<boolean> {
    const service = this.services.find(s => s.id === id)
    if (!service) return false

    service.status = 'starting'
    
    // Simulate restart process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    service.status = 'running'
    service.uptime = Date.now()
    service.restarts += 1
    service.lastRestart = new Date().toISOString()

    return true
  }

  async stopService(id: string): Promise<boolean> {
    const service = this.services.find(s => s.id === id)
    if (!service) return false

    service.status = 'stopping'
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    service.status = 'stopped'
    service.health.healthy = false

    return true
  }

  async startService(id: string): Promise<boolean> {
    const service = this.services.find(s => s.id === id)
    if (!service) return false

    service.status = 'starting'
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    service.status = 'running'
    service.uptime = Date.now()
    service.health.healthy = true
    service.health.lastCheck = new Date().toISOString()

    return true
  }

  getAlerts(status?: Alert['status']): Alert[] {
    return this.alerts
      .filter(alert => !status || alert.status === status)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
  }

  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert || alert.status !== 'active') return false

    alert.status = 'acknowledged'
    alert.acknowledgedAt = new Date().toISOString()
    alert.acknowledgedBy = userId

    return true
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId)
    if (ruleIndex < 0) return false

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates }
    return true
  }

  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    this.alertRules.push(newRule)
    return newRule
  }

  deleteAlertRule(ruleId: string): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId)
    if (ruleIndex < 0) return false

    this.alertRules.splice(ruleIndex, 1)
    return true
  }

  getPerformanceLogs(limit = 100): PerformanceLog[] {
    return this.performanceLogs.slice(-limit).reverse()
  }

  getSystemHealth(): SystemHealth {
    const latestMetrics = this.getCurrentMetrics()
    const activeAlerts = this.getAlerts('active')
    const services = this.getServices()

    let score = 100
    let overall: SystemHealth['overall'] = 'healthy'

    const checks = {
      database: 'healthy' as const,
      storage: 'healthy' as const,
      network: 'healthy' as const,
      services: 'healthy' as const,
      security: 'healthy' as const
    }

    if (latestMetrics) {
      // Check CPU
      if (latestMetrics.cpu.usage > 80) {
        score -= 20
        checks.services = 'warning'
      }
      
      // Check Memory
      if (latestMetrics.memory.percentage > 85) {
        score -= 25
        checks.services = 'error'
      }
      
      // Check Disk
      if (latestMetrics.disk.percentage > 90) {
        score -= 30
        checks.storage = 'error'
      } else if (latestMetrics.disk.percentage > 80) {
        score -= 15
        checks.storage = 'warning'
      }
    }

    // Check services
    const downServices = services.filter(s => s.status === 'stopped' || s.status === 'error')
    if (downServices.length > 0) {
      score -= downServices.length * 20
      checks.services = 'error'
    }

    const unhealthyServices = services.filter(s => !s.health.healthy)
    if (unhealthyServices.length > 0) {
      score -= unhealthyServices.length * 10
      if (checks.services === 'healthy') checks.services = 'warning'
    }

    // Check alerts
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    const highAlerts = activeAlerts.filter(a => a.severity === 'high')
    
    if (criticalAlerts.length > 0) {
      score -= criticalAlerts.length * 25
      overall = 'critical'
    } else if (highAlerts.length > 0 || score < 70) {
      overall = 'warning'
    }

    if (score < 50) {
      overall = 'critical'
    }

    score = Math.max(0, score)

    return {
      overall,
      score,
      checks,
      lastCheck: new Date().toISOString(),
      uptime: Date.now() - (24 * 60 * 60 * 1000) // 24 hours uptime
    }
  }

  isMonitoring(): boolean {
    return this.isRunning
  }
}
