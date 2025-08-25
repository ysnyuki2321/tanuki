"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DatabaseGUI } from "@/components/database/database-gui"
import { ResponsiveHeader } from "@/components/navigation/responsive-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Zap, 
  BarChart3, 
  Shield, 
  Sparkles,
  Activity,
  Clock,
  Users,
  Server,
  PlayCircle,
  FileCode,
  Eye
} from "lucide-react"

export default function DatabasePage() {
  const stats = [
    {
      title: "Database Connections",
      value: "2",
      icon: <Database className="h-4 w-4 text-muted-foreground" />,
      description: "+1 from last month"
    },
    {
      title: "Total Tables",
      value: "24",
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      description: "Across all databases"
    },
    {
      title: "Total Records",
      value: "1.2M",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      description: "+12% from last week"
    },
    {
      title: "Query Performance",
      value: "156ms",
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      description: "Average query time"
    }
  ]

  const features = [
    {
      title: "Visual Query Builder",
      description: "Build complex queries without SQL",
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      status: "Active"
    },
    {
      title: "Real-time Analytics",
      description: "Live data insights and monitoring",
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      status: "Available"
    },
    {
      title: "Multi-Database Support",
      description: "PostgreSQL, MySQL, SQLite",
      icon: <Database className="h-8 w-8 text-purple-500" />,
      status: "Connected"
    },
    {
      title: "Enterprise Security",
      description: "SSL encryption and access control",
      icon: <Shield className="h-8 w-8 text-red-500" />,
      status: "Secured"
    }
  ]

  const advancedFeatures = [
    {
      title: "IntelliSense & Auto-completion",
      description: "Smart SQL completion and error detection"
    },
    {
      title: "Visual Schema Designer", 
      description: "Design and modify database schemas visually"
    },
    {
      title: "Query Performance Analysis",
      description: "Analyze and optimize query performance"
    },
    {
      title: "Real-time Data Browser",
      description: "Browse table data with live filtering"
    },
    {
      title: "Export & Import Tools",
      description: "Export data in multiple formats"
    },
    {
      title: "Collaborative Queries",
      description: "Share and collaborate on SQL queries"
    }
  ]

  const securityFeatures = [
    {
      title: "Encrypted Connections",
      description: "All database connections are SSL encrypted"
    },
    {
      title: "Role-based Access",
      description: "Fine-grained permissions and audit logs"
    },
    {
      title: "Query Optimization",
      description: "Automatic performance recommendations"
    },
    {
      title: "Backup Integration",
      description: "Automated backup and restore capabilities"
    },
    {
      title: "Real-time Monitoring",
      description: "Live database health and performance metrics"
    }
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <PlayCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Run Query</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <FileCode className="h-4 w-4" />
        <span className="hidden sm:inline">New Query</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">Preview</span>
      </Button>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <ResponsiveHeader 
          title="Database GUI"
          subtitle="Advanced database management"
          actions={headerActions}
        />

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b">
          <div className="container mx-auto px-4 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                    <Database className="h-8 w-8" />
                    Advanced Database GUI
                  </h1>
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Professional
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Professional database management with visual query builder, real-time data browser, and advanced SQL editor
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  PostgreSQL
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Connected
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  SSL Secured
                </Badge>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {feature.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Database Management Interface */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management Interface
                  </CardTitle>
                  <CardDescription>
                    Professional database management with visual query builder, real-time data browser, and advanced SQL editor
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    PostgreSQL
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Connected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DatabaseGUI />
            </CardContent>
          </Card>

          {/* Features Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Professional database management capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {advancedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Security & Performance
                </CardTitle>
                <CardDescription>
                  Enterprise-grade database security and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {securityFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>
                Current database connections and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="font-medium">Production DB</p>
                      <p className="text-sm text-muted-foreground">postgresql://prod-db</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Online
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div>
                      <p className="font-medium">Development DB</p>
                      <p className="text-sm text-muted-foreground">sqlite://local.db</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    Idle
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-medium">Analytics DB</p>
                      <p className="text-sm text-muted-foreground">postgresql://analytics</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Connected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
