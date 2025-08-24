"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { FileManager } from "@/components/file-manager/file-manager"
import { SSHStorageExpansion } from "@/components/ssh-storage-expansion"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { TanukiLogo } from "@/components/tanuki-logo"
import { LogOut, Settings, User, Database, Code, Menu, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState } from "react"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
              <TanukiLogo size={32} />

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Link href="/database">
                    <Button variant="outline" size="sm">
                      <Database className="w-4 h-4 mr-2" />
                      Database GUI
                    </Button>
                  </Link>
                  <Link href="/editor">
                    <Button variant="outline" size="sm">
                      <Code className="w-4 h-4 mr-2" />
                      Code Editor
                    </Button>
                  </Link>
                </div>

                <span className="text-sm text-muted-foreground">Welcome back, {user?.name}</span>

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

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="md:hidden py-4 border-t mt-4">
                <div className="flex flex-col gap-3">
                  <Link href="/database" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Database GUI
                    </Button>
                  </Link>
                  <Link href="/editor" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      Code Editor
                    </Button>
                  </Link>
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Welcome back, {user?.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your files, expand storage, and organize your digital workspace</p>
          </div>

          <Tabs defaultValue="files" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="files">File Manager</TabsTrigger>
              <TabsTrigger value="storage">Storage Expansion</TabsTrigger>
              <TabsTrigger value="overview" className="hidden lg:block">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">File Manager</h2>
                <p className="text-muted-foreground mb-6">Manage your files, edit code, and organize your digital workspace</p>
                <FileManager />
              </div>
            </TabsContent>

            <TabsContent value="storage" className="space-y-6">
              <SSHStorageExpansion />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Quick Stats</h3>
                  <p className="text-muted-foreground">Overview of your storage and usage</p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Recent Activity</h3>
                  <p className="text-muted-foreground">Latest file operations and changes</p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">System Health</h3>
                  <p className="text-muted-foreground">Monitor your storage nodes status</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
