"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { ResponsiveHeader } from "@/components/navigation/responsive-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { 
  Shield, 
  Users, 
  Server, 
  Database, 
  Mail, 
  Activity,
  Settings,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  Crown,
  Monitor,
  HardDrive,
  Network
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need administrator privileges to access this area.</p>
        </div>
      </div>
    )
  }

  const systemStats = [
    {
      title: "Total Users",
      value: "1,247",
      change: "+12% from last month",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600"
    },
    {
      title: "Active Sessions",
      value: "892",
      change: "Currently online",
      icon: <Activity className="h-4 w-4" />,
      color: "text-green-600"
    },
    {
      title: "Server Nodes",
      value: "3",
      change: "All online",
      icon: <Server className="h-4 w-4" />,
      color: "text-purple-600"
    },
    {
      title: "Storage Used",
      value: "3.2 TB",
      change: "64% of 5TB capacity",
      icon: <HardDrive className="h-4 w-4" />,
      color: "text-orange-600"
    },
    {
      title: "Database Connections",
      value: "2",
      change: "PostgreSQL & SQLite",
      icon: <Database className="h-4 w-4" />,
      color: "text-indigo-600"
    },
    {
      title: "Email Queue",
      value: "156",
      change: "Notifications pending",
      icon: <Mail className="h-4 w-4" />,
      color: "text-pink-600"
    }
  ]

  const adminFeatures = [
    {
      title: "User Management",
      description: "Comprehensive user administration, roles, and permissions",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      features: ["User profiles", "Role management", "Access control", "Activity monitoring"]
    },
    {
      title: "SSH Server Management", 
      description: "Remote server connections and disk management",
      icon: <Server className="h-8 w-8 text-green-500" />,
      features: ["SSH connections", "Disk discovery", "Mount management", "Server monitoring"]
    },
    {
      title: "SMTP & Notifications",
      description: "Email service and system notifications",
      icon: <Mail className="h-8 w-8 text-purple-500" />,
      features: ["SMTP configuration", "Email templates", "Notification rules", "Email queue"]
    },
    {
      title: "System Monitoring",
      description: "Real-time system health and performance metrics",
      icon: <BarChart3 className="h-8 w-8 text-red-500" />,
      features: ["Performance metrics", "Health monitoring", "Alert system", "Analytics"]
    }
  ]

  const systemAlerts = [
    {
      type: "warning",
      title: "High Memory Usage",
      message: "Server node-3 memory usage is at 85%",
      time: "5 minutes ago"
    },
    {
      type: "info", 
      title: "New User Registration",
      message: "3 new users registered in the last hour",
      time: "12 minutes ago"
    },
    {
      type: "success",
      title: "Backup Completed",
      message: "Daily database backup completed successfully",
      time: "1 hour ago"
    }
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">System Settings</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Monitoring</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Live Status</span>
      </Button>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <ResponsiveHeader 
          title="Admin Panel"
          subtitle="System administration and management"
          actions={headerActions}
        />

        {/* Admin Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
          <div className="container mx-auto px-4 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                    <Shield className="h-8 w-8" />
                    Administrator Dashboard
                  </h1>
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin Access
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Complete system administration, user management, server monitoring, and security controls
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  System Online
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  <Network className="h-3 w-3 mr-1" />
                  All Services Active
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Zap className="h-3 w-3 mr-1" />
                  High Performance
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {systemStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Features Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Administrative Features
                  </CardTitle>
                  <CardDescription>
                    Comprehensive system management capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {adminFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {feature.features.map((feat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    System Alerts
                  </CardTitle>
                  <CardDescription>
                    Recent system events and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`p-1 rounded-full ${
                          alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                          alert.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                          'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          {alert.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                          {alert.type === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                          {alert.type === 'info' && <Activity className="h-3 w-3 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <Users className="h-5 w-5" />
                      <span className="text-xs">Manage Users</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <Server className="h-5 w-5" />
                      <span className="text-xs">SSH Servers</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <Mail className="h-5 w-5" />
                      <span className="text-xs">SMTP Config</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <Shield className="h-5 w-5" />
                      <span className="text-xs">Security</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto flex-col gap-2 p-4">
                      <Monitor className="h-5 w-5" />
                      <span className="text-xs">Monitoring</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Admin Dashboard */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Administration Interface
                  </CardTitle>
                  <CardDescription>
                    Complete administrative control panel with user management, system monitoring, and configuration tools
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AdminDashboard />
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
