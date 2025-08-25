"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { NotificationService, type Notification, type NotificationAction } from "@/lib/notifications"
import { toast } from "sonner"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  // Core actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  // Utility methods for creating notifications
  notifySuccess: (title: string, message: string, category?: Notification["category"]) => Promise<void>
  notifyError: (title: string, message: string, category?: Notification["category"]) => Promise<void>
  notifyWarning: (title: string, message: string, category?: Notification["category"]) => Promise<void>
  notifyInfo: (title: string, message: string, category?: Notification["category"]) => Promise<void>
  // File-specific notifications
  notifyFileUploaded: (fileName: string, fileId: string) => Promise<void>
  notifyFileShared: (fileName: string, recipientEmail: string, fileId: string) => Promise<void>
  notifyFileDeleted: (fileName: string) => Promise<void>
  notifyCodeSaved: (fileName: string, fileId: string) => Promise<void>
  notifyDatabaseConnected: (databaseName: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const notificationService = NotificationService.getInstance()

  // Load initial notifications and set up subscription
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getUnreadCount()
        ])
        setNotifications(notifs)
        setUnreadCount(count)
      } catch (error) {
        console.error("Failed to load notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe(async (newNotifications) => {
      setNotifications(newNotifications)
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    })

    return unsubscribe
  }, [])

  // Show toast notifications for new notifications
  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      const preferences = notificationService.getPreferences()
      
      if (!preferences.enabled || !preferences.showToasts) return
      if (!preferences.categories[notification.category]) return

      const toastConfig = {
        duration: 5000,
        action: notification.actions?.length ? {
          label: notification.actions[0].label,
          onClick: notification.actions[0].action
        } : undefined
      }

      switch (notification.type) {
        case "success":
          toast.success(notification.title, {
            description: notification.message,
            ...toastConfig
          })
          break
        case "error":
          toast.error(notification.title, {
            description: notification.message,
            ...toastConfig
          })
          break
        case "warning":
          toast.warning(notification.title, {
            description: notification.message,
            ...toastConfig
          })
          break
        case "info":
          toast.info(notification.title, {
            description: notification.message,
            ...toastConfig
          })
          break
      }
    }

    // Check for new notifications (those created in the last 5 seconds)
    const recentNotifications = notifications.filter(n => {
      const notifTime = new Date(n.timestamp).getTime()
      const now = Date.now()
      return (now - notifTime) < 5000 && !n.isRead
    })

    // Only show toasts for the most recent notification to avoid spam
    if (recentNotifications.length > 0) {
      const latestNotification = recentNotifications[0]
      handleNewNotification(latestNotification)
    }
  }, [notifications])

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const clearAll = async () => {
    try {
      await notificationService.clearAll()
    } catch (error) {
      console.error("Failed to clear all notifications:", error)
    }
  }

  // Utility methods for creating notifications
  const notifySuccess = async (title: string, message: string, category: Notification["category"] = "system") => {
    try {
      await notificationService.createNotification(title, message, "success", category)
    } catch (error) {
      console.error("Failed to create success notification:", error)
    }
  }

  const notifyError = async (title: string, message: string, category: Notification["category"] = "system") => {
    try {
      await notificationService.createNotification(title, message, "error", category)
    } catch (error) {
      console.error("Failed to create error notification:", error)
    }
  }

  const notifyWarning = async (title: string, message: string, category: Notification["category"] = "system") => {
    try {
      await notificationService.createNotification(title, message, "warning", category)
    } catch (error) {
      console.error("Failed to create warning notification:", error)
    }
  }

  const notifyInfo = async (title: string, message: string, category: Notification["category"] = "system") => {
    try {
      await notificationService.createNotification(title, message, "info", category)
    } catch (error) {
      console.error("Failed to create info notification:", error)
    }
  }

  // File-specific notification methods
  const notifyFileUploaded = async (fileName: string, fileId: string) => {
    try {
      await notificationService.notifyFileUploaded(fileName, fileId)
    } catch (error) {
      console.error("Failed to create file upload notification:", error)
    }
  }

  const notifyFileShared = async (fileName: string, recipientEmail: string, fileId: string) => {
    try {
      await notificationService.notifyFileShared(fileName, recipientEmail, fileId)
    } catch (error) {
      console.error("Failed to create file share notification:", error)
    }
  }

  const notifyFileDeleted = async (fileName: string) => {
    try {
      await notificationService.notifyFileDeleted(fileName)
    } catch (error) {
      console.error("Failed to create file delete notification:", error)
    }
  }

  const notifyCodeSaved = async (fileName: string, fileId: string) => {
    try {
      await notificationService.notifyCodeSaved(fileName, fileId)
    } catch (error) {
      console.error("Failed to create code save notification:", error)
    }
  }

  const notifyDatabaseConnected = async (databaseName: string) => {
    try {
      await notificationService.notifyDatabaseConnected(databaseName)
    } catch (error) {
      console.error("Failed to create database connection notification:", error)
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyFileUploaded,
    notifyFileShared,
    notifyFileDeleted,
    notifyCodeSaved,
    notifyDatabaseConnected,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
