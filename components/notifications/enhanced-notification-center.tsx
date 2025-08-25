"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Database,
  Shield,
  Share2,
  HardDrive,
  Mail,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { DemoNotificationService, type Notification } from '@/lib/demo-notifications'
import { isSupabaseConfigured } from '@/lib/supabase-client'
import { toast } from 'sonner'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'system': return <Settings className="w-4 h-4" />
    case 'security': return <Shield className="w-4 h-4" />
    case 'storage': return <HardDrive className="w-4 h-4" />
    case 'sharing': return <Share2 className="w-4 h-4" />
    case 'general': return <Bell className="w-4 h-4" />
    default: return <Info className="w-4 h-4" />
  }
}

const getTypeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'info': return <Info className="w-4 h-4 text-blue-500" />
    default: return <Info className="w-4 h-4 text-blue-500" />
  }
}

const getTypeColor = (type: Notification['type']) => {
  switch (type) {
    case 'success': return 'border-l-green-500 bg-green-50'
    case 'warning': return 'border-l-yellow-500 bg-yellow-50'
    case 'error': return 'border-l-red-500 bg-red-50'
    case 'info': return 'border-l-blue-500 bg-blue-50'
    default: return 'border-l-gray-500 bg-gray-50'
  }
}

export function EnhancedNotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const categories = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'system', label: 'System', icon: Settings },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'storage', label: 'Storage', icon: HardDrive },
    { key: 'sharing', label: 'Sharing', icon: Share2 },
    { key: 'general', label: 'General', icon: Mail }
  ]

  // Load notifications
  useEffect(() => {
    if (user && isOpen) {
      loadNotifications()
    }
  }, [user, isOpen])

  // Filter notifications
  useEffect(() => {
    let filtered = notifications

    if (activeCategory !== 'all') {
      filtered = filtered.filter(n => n.category === activeCategory)
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.read)
    }

    setFilteredNotifications(filtered)
  }, [notifications, activeCategory, showUnreadOnly])

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Initialize demo notifications if needed
      DemoNotificationService.initializeDemoNotifications()

      // Load notifications
      const notifs = await DemoNotificationService.getNotifications(user.id, {
        limit: 100
      })

      setNotifications(notifs)

      // Get unread count
      const count = await DemoNotificationService.getUnreadCount(user.id)
      setUnreadCount(count)

      // Start simulation for demo
      if (!isSupabaseConfigured()) {
        DemoNotificationService.simulateNotifications(user.id)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await DemoNotificationService.markAsRead(notificationId)
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const count = await DemoNotificationService.markAllAsRead(user.id)
      if (count > 0) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success(`Marked ${count} notifications as read`)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const success = await DemoNotificationService.deleteNotification(notificationId)
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const clearAllNotifications = async () => {
    if (!user) return

    if (!confirm('Are you sure you want to clear all notifications?')) {
      return
    }

    try {
      const count = await DemoNotificationService.clearNotifications(user.id)
      setNotifications([])
      setUnreadCount(0)
      toast.success(`Cleared ${count} notifications`)
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
    
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end p-4">
      <Card className="w-full max-w-md h-[90vh] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              <Filter className="w-3 h-3 mr-1" />
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
            {/* Category Tabs */}
            <div className="px-4">
              <TabsList className="grid grid-cols-3 w-full h-auto">
                {categories.slice(0, 3).map((category) => {
                  const Icon = category.icon
                  const count = activeCategory === 'all' 
                    ? notifications.filter(n => n.category === category.key).length
                    : undefined
                  
                  return (
                    <TabsTrigger key={category.key} value={category.key} className="flex flex-col items-center gap-1 py-2">
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{category.label}</span>
                      {count !== undefined && count > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              <TabsList className="grid grid-cols-3 w-full h-auto mt-1">
                {categories.slice(3).map((category) => {
                  const Icon = category.icon
                  const count = notifications.filter(n => n.category === category.key).length
                  
                  return (
                    <TabsTrigger key={category.key} value={category.key} className="flex flex-col items-center gap-1 py-2">
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{category.label}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}
                <TabsTrigger value="all" className="flex flex-col items-center gap-1 py-2">
                  <Bell className="w-3 h-3" />
                  <span className="text-xs">All</span>
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-hidden">
              {categories.map((category) => (
                <TabsContent key={category.key} value={category.key} className="h-full m-0">
                  <ScrollArea className="h-full px-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading notifications...
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">No notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {showUnreadOnly ? 'No unread notifications' : 'You\'re all caught up!'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 pb-4">
                        {filteredNotifications.map((notification) => (
                          <Card 
                            key={notification.id} 
                            className={`
                              cursor-pointer border-l-4 transition-all hover:shadow-md
                              ${getTypeColor(notification.type)}
                              ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}
                            `}
                            onClick={() => handleNotificationAction(notification)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getTypeIcon(notification.type)}
                                    {getCategoryIcon(notification.category)}
                                    <h4 className="font-medium text-sm truncate">
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                    
                                    {notification.actionLabel && (
                                      <Button variant="outline" size="sm" className="text-xs h-6">
                                        {notification.actionLabel}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead(notification.id)
                                      }}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}

              <TabsContent value="all" className="h-full m-0">
                <ScrollArea className="h-full px-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading notifications...
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No notifications</p>
                      <p className="text-sm text-muted-foreground">
                        {showUnreadOnly ? 'No unread notifications' : 'You\'re all caught up!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {filteredNotifications.map((notification) => (
                        <Card 
                          key={notification.id} 
                          className={`
                            cursor-pointer border-l-4 transition-all hover:shadow-md
                            ${getTypeColor(notification.type)}
                            ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}
                          `}
                          onClick={() => handleNotificationAction(notification)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTypeIcon(notification.type)}
                                  {getCategoryIcon(notification.category)}
                                  <h4 className="font-medium text-sm truncate">
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                  
                                  {notification.actionLabel && (
                                    <Button variant="outline" size="sm" className="text-xs h-6">
                                      {notification.actionLabel}
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notification.id)
                                    }}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedNotificationCenter
