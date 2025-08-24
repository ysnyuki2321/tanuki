"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { TanukiLogo } from "@/components/tanuki-logo"
import {
  Menu,
  Home,
  Database,
  Code,
  Settings,
  Users,
  BarChart3,
  Share2,
  Shield,
  Bell,
  HardDrive,
  Mail,
  Server,
  LogOut,
  User,
  FileText,
  Folder,
  Search,
  Star,
  Clock,
  Download,
  Upload,
  Link2
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface MobileNavProps {
  isAdmin?: boolean
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
    setIsOpen(false)
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      description: "File management and overview"
    },
    {
      title: "Code Editor",
      href: "/editor",
      icon: <Code className="h-5 w-5" />,
      description: "Advanced code editing with Monaco",
      badge: "Pro"
    },
    {
      title: "Database GUI",
      href: "/database",
      icon: <Database className="h-5 w-5" />,
      description: "Visual query builder and management",
      badge: "New"
    }
  ]

  const adminItems = [
    {
      title: "Admin Panel",
      href: "/admin",
      icon: <Shield className="h-5 w-5" />,
      description: "System administration"
    }
  ]

  const quickActions = [
    {
      title: "Upload Files",
      icon: <Upload className="h-4 w-4" />,
      action: () => {
        // Trigger file upload
        console.log("Upload files")
        setIsOpen(false)
      }
    },
    {
      title: "Create Folder",
      icon: <Folder className="h-4 w-4" />,
      action: () => {
        // Trigger create folder
        console.log("Create folder")
        setIsOpen(false)
      }
    },
    {
      title: "Share Link",
      icon: <Link2 className="h-4 w-4" />,
      action: () => {
        // Open share dialog
        console.log("Share link")
        setIsOpen(false)
      }
    },
    {
      title: "Search Files",
      icon: <Search className="h-4 w-4" />,
      action: () => {
        // Focus search
        console.log("Search files")
        setIsOpen(false)
      }
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <TanukiLogo size={32} />
              <div>
                <SheetTitle className="text-left">Tanuki Storage</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Advanced web storage platform
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            {/* User Info */}
            <div className="mb-6 rounded-lg bg-muted p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-2 p-3"
                    onClick={action.action}
                  >
                    {action.icon}
                    <span className="text-xs">{action.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Navigation */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Navigation</h3>
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <div
                      className={`flex items-center gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent ${
                        isActive(item.href) ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      {item.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <>
                <Separator className="mb-6" />
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Administration</h3>
                  <div className="space-y-1">
                    {adminItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <div
                          className={`flex items-center gap-3 rounded-md p-3 text-sm transition-colors hover:bg-accent ${
                            isActive(item.href) ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          {item.icon}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{item.title}</span>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Recent Files */}
            <Separator className="mb-6" />
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Recent Files</h3>
              <div className="space-y-2">
                {[
                  { name: "project-proposal.pdf", icon: <FileText className="h-4 w-4" />, time: "2 hours ago" },
                  { name: "database-schema.sql", icon: <Database className="h-4 w-4" />, time: "1 day ago" },
                  { name: "main.py", icon: <Code className="h-4 w-4" />, time: "3 days ago" }
                ].map((file, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-accent">
                    {file.icon}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Settings and Profile */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 p-3"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Profile Settings</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 p-3"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>App Settings</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 p-3"
                onClick={() => setIsOpen(false)}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </Button>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-6">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
