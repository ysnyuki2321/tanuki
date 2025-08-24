"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DatabaseGUI } from "@/components/database/database-gui"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TanukiLogo } from "@/components/tanuki-logo"
import { LogOut, Settings, User, ArrowLeft, Database, Zap, BarChart3, Shield, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function DatabasePage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <TanukiLogo size={32} />
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    Advanced Database GUI
                  </h1>
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Professional
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Secure Database Management
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Features Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Visual Query Builder</h3>
                  <p className="text-xs text-muted-foreground">Build queries without SQL</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Real-time Analytics</h3>
                  <p className="text-xs text-muted-foreground">Live data insights</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Multi-Database</h3>
                  <p className="text-xs text-muted-foreground">PostgreSQL, MySQL, SQLite</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Secure Access</h3>
                  <p className="text-xs text-muted-foreground">Enterprise security</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Connections</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  Across all databases
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2M</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156ms</div>
                <p className="text-xs text-muted-foreground">
                  Average query time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Database GUI */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Management Interface
                  </CardTitle>
                  <CardDescription>
                    Professional database management with visual query builder, real-time data browser, and advanced SQL editor
                  </CardDescription>
                </div>
                <div className="flex gap-2">
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

          {/* Additional Features */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
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
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Visual Query Builder - Build complex queries without SQL
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Real-time Data Browser - Live table data with filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    SQL Editor - Advanced syntax highlighting & completion
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Schema Management - Create, modify, and analyze tables
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Performance Analytics - Query optimization insights
                  </li>
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
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Encrypted Connections - All database connections are SSL encrypted
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Access Control - Role-based permissions and audit logs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Query Optimization - Automatic performance recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Backup Integration - Automated backup and restore capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Real-time Monitoring - Live database health and performance metrics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
