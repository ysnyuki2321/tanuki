// Demo notification service - works without external dependencies
// Uses localStorage for demo purposes

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'security' | 'storage' | 'sharing' | 'general'
  read: boolean
  actionUrl?: string
  actionLabel?: string
  createdAt: string
  userId: string
}

export class DemoNotificationService {
  private static readonly STORAGE_KEY = 'tanuki_demo_notifications'

  // Get demo notifications from localStorage
  static getDemoNotifications(): Notification[] {
    if (typeof window === 'undefined') return []

    try {
      const notifications = localStorage.getItem(this.STORAGE_KEY)
      return notifications ? JSON.parse(notifications) : this.getDefaultNotifications()
    } catch {
      return this.getDefaultNotifications()
    }
  }

  // Save demo notifications to localStorage
  static saveDemoNotifications(notifications: Notification[]) {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.warn('Failed to save demo notifications:', error)
    }
  }

  // Get default notifications for demo
  static getDefaultNotifications(): Notification[] {
    return [
      {
        id: 'welcome-1',
        title: 'Welcome to Tanuki Storage!',
        message: 'Your account has been created successfully. Start by uploading your first file.',
        type: 'success',
        category: 'system',
        read: false,
        actionUrl: '/dashboard?tab=files',
        actionLabel: 'Upload Files',
        createdAt: new Date().toISOString(),
        userId: 'demo'
      },
      {
        id: 'demo-mode-2',
        title: 'Demo Mode Active',
        message: 'You are using the platform in demo mode. Connect a database to enable full functionality.',
        type: 'info',
        category: 'system',
        read: false,
        actionUrl: '/admin',
        actionLabel: 'Setup Database',
        createdAt: new Date(Date.now() - 60 * 1000).toISOString(),
        userId: 'demo'
      },
      {
        id: 'storage-info-3',
        title: 'Storage Quota',
        message: 'You have 1GB of storage available in demo mode. Files are stored locally.',
        type: 'info',
        category: 'storage',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        userId: 'demo'
      }
    ]
  }

  // Get notifications for specific user
  static async getNotifications(userId: string, options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    category?: string
  } = {}): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false, category } = options

    let notifications = this.getDemoNotifications()

    // Filter by user
    notifications = notifications.filter(n => n.userId === userId || n.userId === 'demo')

    // Filter by read status
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    // Filter by category
    if (category) {
      notifications = notifications.filter(n => n.category === category)
    }

    // Sort by created date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    return notifications.slice(offset, offset + limit)
  }

  // Create new notification
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `demo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString()
    }

    const notifications = this.getDemoNotifications()
    notifications.unshift(newNotification)

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100)
    }

    this.saveDemoNotifications(notifications)
    return newNotification
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    const notifications = this.getDemoNotifications()
    const notification = notifications.find(n => n.id === notificationId)

    if (!notification) return false

    notification.read = true
    this.saveDemoNotifications(notifications)
    return true
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string): Promise<number> {
    const notifications = this.getDemoNotifications()
    let count = 0

    notifications.forEach(n => {
      if ((n.userId === userId || n.userId === 'demo') && !n.read) {
        n.read = true
        count++
      }
    })

    this.saveDemoNotifications(notifications)
    return count
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    const notifications = this.getDemoNotifications()
    const index = notifications.findIndex(n => n.id === notificationId)

    if (index === -1) return false

    notifications.splice(index, 1)
    this.saveDemoNotifications(notifications)
    return true
  }

  // Get unread count for user
  static async getUnreadCount(userId: string): Promise<number> {
    const notifications = this.getDemoNotifications()
    return notifications.filter(n => 
      (n.userId === userId || n.userId === 'demo') && !n.read
    ).length
  }

  // Send notification (demo - just creates notification)
  static async sendNotification(userId: string, notification: {
    title: string
    message: string
    type: Notification['type']
    category: Notification['category']
    actionUrl?: string
    actionLabel?: string
  }): Promise<Notification> {
    return await this.createNotification({
      ...notification,
      userId,
      read: false
    })
  }

  // Send system notification to all users
  static async sendSystemNotification(notification: {
    title: string
    message: string
    type: Notification['type']
    actionUrl?: string
    actionLabel?: string
  }): Promise<Notification> {
    return await this.createNotification({
      ...notification,
      userId: 'demo', // Global notification
      category: 'system',
      read: false
    })
  }

  // Clear all notifications for user
  static async clearNotifications(userId: string): Promise<number> {
    const notifications = this.getDemoNotifications()
    const originalLength = notifications.length

    const filteredNotifications = notifications.filter(n => 
      n.userId !== userId && n.userId !== 'demo'
    )

    this.saveDemoNotifications(filteredNotifications)
    return originalLength - filteredNotifications.length
  }

  // Check if demo mode is active
  static isDemoMode(): boolean {
    return typeof window !== 'undefined'
  }

  // Initialize demo notifications
  static initializeDemoNotifications() {
    if (typeof window === 'undefined') return

    const existing = localStorage.getItem(this.STORAGE_KEY)
    if (!existing) {
      this.saveDemoNotifications(this.getDefaultNotifications())
    }
  }

  // Clear all demo notifications
  static clearDemoNotifications(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear demo notifications:', error)
    }
  }

  // Simulate real-time notifications (for demo)
  static simulateNotifications(userId: string) {
    if (typeof window === 'undefined') return

    const notifications = [
      {
        title: 'File Uploaded',
        message: 'Your file has been uploaded successfully',
        type: 'success' as const,
        category: 'storage' as const
      },
      {
        title: 'Storage Warning',
        message: 'You are using 80% of your storage quota',
        type: 'warning' as const,
        category: 'storage' as const
      },
      {
        title: 'File Shared',
        message: 'Someone accessed your shared file',
        type: 'info' as const,
        category: 'sharing' as const
      }
    ]

    // Send random notification every 30 seconds in demo
    setTimeout(() => {
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
      this.sendNotification(userId, randomNotification)
    }, 30000)
  }
}

export default DemoNotificationService
