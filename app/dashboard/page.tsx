"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdvancedFileManager } from "@/components/file-manager/advanced-file-manager"
import { ResponsiveHeader } from "@/components/navigation/responsive-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { 
  HardDrive, 
  Users, 
  FileText, 
  Share2, 
  TrendingUp, 
  Activity,
  Zap,
  Database,
  Code,
  Cloud,
  Upload,
  Download
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      title: "Storage Used",
      value: "2.4 GB",
      total: "10 GB",
      percentage: 24,
      icon: <HardDrive className="h-5 w-5" />,
      trend: "+12% from last month"
    },
    {
      title: "Total Files",
      value: "1,247",
      icon: <FileText className="h-5 w-5" />,
      trend: "+23 new files this week"
    },
    {
      title: "Shared Links",
      value: "56",
      icon: <Share2 className="h-5 w-5" />,
      trend: "+5 active shares"
    },
    {
      title: "Activity",
      value: "89%",
      icon: <Activity className="h-5 w-5" />,
      trend: "High activity today"
    }
  ]

  const quickActions = [
    {
      title: "Code Editor",
      description: "Edit code with Monaco Editor",
      href: "/editor",
      icon: <Code className="h-8 w-8" />,
      badge: "Pro",
      badgeVariant: "default" as const,
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      title: "Database GUI",
      description: "Visual query builder and management",
      href: "/database", 
      icon: <Database className="h-8 w-8" />,
      badge: "New",
      badgeVariant: "secondary" as const,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Admin Panel",
      description: "System administration tools",
      href: "/admin",
      icon: <Zap className="h-8 w-8" />,
      badge: "Admin",
      badgeVariant: "destructive" as const,
      gradient: "from-purple-500 to-pink-600",
      adminOnly: true
    }
  ]

  const recentFiles = [
    { name: "project-proposal.pdf", size: "2.4 MB", modified: "2 hours ago", shared: true },
    { name: "database-schema.sql", size: "156 KB", modified: "1 day ago", shared: false },
    { name: "main.py", size: "8.2 KB", modified: "3 days ago", shared: true },
    { name: "config.json", size: "1.2 KB", modified: "1 week ago", shared: false },
    { name: "README.md", size: "4.1 KB", modified: "2 weeks ago", shared: true }
  ]

  const isAdmin = user?.role === 'admin'

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <ResponsiveHeader 
          title="Dashboard"
          subtitle="Professional web storage platform"
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-muted-foreground">
                Manage your files, edit code, and organize your digital workspace
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions
                .filter(action => !action.adminOnly || isAdmin)
                .map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${action.gradient} text-white`}>
                          {action.icon}
                        </div>
                        <Badge variant={action.badgeVariant} className="text-xs">
                          {action.badge}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className="text-muted-foreground">
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {stat.value}
                    {stat.total && (
                      <span className="text-sm text-muted-foreground font-normal">
                        / {stat.total}
                      </span>
                    )}
                  </div>
                  {stat.percentage && (
                    <div className="mt-2">
                      <Progress value={stat.percentage} className="h-2" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* File Manager - Takes more space */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        File Manager
                      </CardTitle>
                      <CardDescription>
                        Upload, organize, and manage your files
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <AdvancedFileManager />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Files */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Files</CardTitle>
                  <CardDescription>
                    Your recently accessed files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} • {file.modified}
                          </p>
                        </div>
                      </div>
                      {file.shared && (
                        <Share2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    View all files
                  </Button>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Storage Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>2.4 GB / 10 GB</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Documents</span>
                      </div>
                      <span className="text-muted-foreground">1.2 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Images</span>
                      </div>
                      <span className="text-muted-foreground">800 MB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>Videos</span>
                      </div>
                      <span className="text-muted-foreground">400 MB</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Storage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
