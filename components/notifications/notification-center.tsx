"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/contexts/notification-context"
import { NotificationService, type Notification } from "@/lib/notifications"
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  X, 
  Trash2, 
  Search,
  Settings,
  FileText,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Filter
} from "lucide-react"

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isOpen, setIsOpen] = useState(false)

  const notificationService = NotificationService.getInstance()

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || notification.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const unreadNotifications = filteredNotifications.filter(n => !n.isRead)
  const readNotifications = filteredNotifications.filter(n => n.isRead)

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const categories = [
    { value: "all", label: "All" },
    { value: "file", label: "Files" },
    { value: "system", label: "System" },
    { value: "auth", label: "Auth" },
    { value: "share", label: "Sharing" },
    { value: "database", label: "Database" },
    { value: "editor", label: "Editor" },
  ]

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <Card className={`mb-3 ${!notification.isRead ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={notificationService.getCategoryColor(notification.category)}>
                  {notificationService.getCategoryIcon(notification.category)} {notification.category}
                </Badge>
                <span>{notificationService.formatTimestamp(notification.timestamp)}</span>
              </div>

              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {notification.actions.map(action => (
                    <Button
                      key={action.id}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => markAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => deleteNotification(notification.id)}
              title="Delete"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-6"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs h-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 overflow-x-auto">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="text-xs h-6 shrink-0"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedCategory !== "all" 
                    ? "No notifications match your filters" 
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="unread" className="text-xs">
                    Unread ({unreadNotifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    All ({filteredNotifications.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="mt-0">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All caught up!</p>
                    </div>
                  ) : (
                    unreadNotifications.map(notification => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="all" className="mt-0">
                  {filteredNotifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>

        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <Settings className="w-3 h-3 mr-2" />
              Notification Settings
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
