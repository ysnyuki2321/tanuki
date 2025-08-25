"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import RealFileManager from "@/components/file-manager/real-file-manager"
import UserDashboard from "@/components/dashboard/user-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TanukiLogo } from "@/components/tanuki-logo"
import { SimpleThemeToggle } from "@/components/theme-toggle"
import { EnhancedNotificationCenter } from "@/components/notifications/enhanced-notification-center"
import { LogOut, Settings, User, BarChart3, Files, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Enhanced Header */}
        <header className="border-b bg-card/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <TanukiLogo size={36} />

              <div className="flex items-center gap-4">
                <SimpleThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                  className="relative hover:bg-primary/10 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <span className="hidden sm:block text-sm text-muted-foreground font-medium">Welcome, {user?.full_name || user?.email}</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name || user?.email} />
                        <AvatarFallback>{user?.full_name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.full_name || 'User'}</p>
                        <p className="w-[160px] truncate text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
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

        {/* Enhanced Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-2">
                  {user?.full_name ? `Hello, ${user.full_name.split(' ')[0]}!` : 'Welcome!'}
                </h1>
                <p className="text-muted-foreground">Manage your workspace with powerful tools</p>
              </div>
              <TabsList className="grid grid-cols-2 bg-muted/50 backdrop-blur-sm border shadow-sm">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Files className="w-4 h-4" />
                  <span className="hidden sm:inline">Files</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border shadow-sm p-1">
                <UserDashboard />
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gradient">File Manager</h2>
                <p className="text-muted-foreground">Edit code, manage files, and query databases - all in one place</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border shadow-sm p-6">
                <RealFileManager />
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Notification Center */}
        <EnhancedNotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </div>
    </ProtectedRoute>
  )
}
