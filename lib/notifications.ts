export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error" | "warning" | "info"
  category: "file" | "system" | "auth" | "share" | "database" | "editor"
  timestamp: string
  isRead: boolean
  actions?: NotificationAction[]
  metadata?: {
    fileId?: string
    fileName?: string
    userId?: string
    url?: string
    [key: string]: any
  }
}

export interface NotificationAction {
  id: string
  label: string
  action: () => void
  variant?: "default" | "destructive" | "outline"
}

export interface NotificationPreferences {
  enabled: boolean
  showToasts: boolean
  playSound: boolean
  categories: {
    file: boolean
    system: boolean
    auth: boolean
    share: boolean
    database: boolean
    editor: boolean
  }
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "File Uploaded Successfully",
    message: "document.pdf has been uploaded to your storage",
    type: "success",
    category: "file",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    isRead: false,
    metadata: {
      fileId: "file123",
      fileName: "document.pdf"
    }
  },
  {
    id: "2", 
    title: "File Shared",
    message: "presentation.pptx has been shared with john@company.com",
    type: "info",
    category: "share",
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    isRead: false,
    metadata: {
      fileId: "file456",
      fileName: "presentation.pptx"
    }
  },
  {
    id: "3",
    title: "Code Editor Auto-saved",
    message: "Your changes to main.py have been automatically saved",
    type: "success",
    category: "editor",
    timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    isRead: true,
    metadata: {
      fileId: "code789",
      fileName: "main.py"
    }
  },
  {
    id: "4",
    title: "Database Connection Error",
    message: "Failed to connect to production database. Please check your credentials.",
    type: "error",
    category: "database",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    isRead: false,
    actions: [
      {
        id: "retry",
        label: "Retry Connection",
        action: () => console.log("Retrying connection..."),
        variant: "default"
      },
      {
        id: "settings",
        label: "Settings", 
        action: () => console.log("Opening settings..."),
        variant: "outline"
      }
    ]
  },
  {
    id: "5",
    title: "Storage Almost Full",
    message: "You've used 4.5GB of your 5GB storage limit. Consider upgrading your plan.",
    type: "warning",
    category: "system",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isRead: false,
    actions: [
      {
        id: "upgrade",
        label: "Upgrade Plan",
        action: () => console.log("Opening upgrade page..."),
        variant: "default"
      }
    ]
  }
]

export class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = [...mockNotifications]
  private listeners: ((notifications: Notification[]) => void)[] = []
  private preferences: NotificationPreferences = {
    enabled: true,
    showToasts: true,
    playSound: true,
    categories: {
      file: true,
      system: true,
      auth: true,
      share: true,
      database: true,
      editor: true
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  async getNotifications(): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  async getUnreadCount(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return this.notifications.filter(n => !n.isRead).length
  }

  async createNotification(
    title: string,
    message: string,
    type: Notification["type"],
    category: Notification["category"],
    metadata?: Notification["metadata"],
    actions?: NotificationAction[]
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      category,
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata,
      actions
    }

    this.notifications.unshift(notification)
    this.notifyListeners()

    // Play sound if enabled
    if (this.preferences.playSound && this.preferences.categories[category]) {
      this.playNotificationSound(type)
    }

    return notification
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
      this.notifyListeners()
      return true
    }
    return false
  }

  async markAllAsRead(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    this.notifications.forEach(n => n.isRead = true)
    this.notifyListeners()
    return true
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const index = this.notifications.findIndex(n => n.id === notificationId)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.notifyListeners()
      return true
    }
    return false
  }

  async clearAll(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    this.notifications = []
    this.notifyListeners()
    return true
  }

  async getNotificationsByCategory(category: Notification["category"]): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return this.notifications.filter(n => n.category === category)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async searchNotifications(query: string): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const lowerQuery = query.toLowerCase()
    return this.notifications.filter(n =>
      n.title.toLowerCase().includes(lowerQuery) ||
      n.message.toLowerCase().includes(lowerQuery) ||
      n.metadata?.fileName?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
  }

  // Utility methods for creating specific types of notifications
  async notifyFileUploaded(fileName: string, fileId: string): Promise<Notification> {
    return this.createNotification(
      "File Uploaded",
      `${fileName} has been uploaded successfully`,
      "success",
      "file",
      { fileName, fileId }
    )
  }

  async notifyFileShared(fileName: string, recipientEmail: string, fileId: string): Promise<Notification> {
    return this.createNotification(
      "File Shared",
      `${fileName} has been shared with ${recipientEmail}`,
      "info",
      "share",
      { fileName, fileId, recipientEmail }
    )
  }

  async notifyFileDeleted(fileName: string): Promise<Notification> {
    return this.createNotification(
      "File Deleted",
      `${fileName} has been moved to trash`,
      "warning",
      "file",
      { fileName }
    )
  }

  async notifyCodeSaved(fileName: string, fileId: string): Promise<Notification> {
    return this.createNotification(
      "Code Saved",
      `Your changes to ${fileName} have been saved`,
      "success",
      "editor",
      { fileName, fileId }
    )
  }

  async notifyDatabaseConnected(databaseName: string): Promise<Notification> {
    return this.createNotification(
      "Database Connected",
      `Successfully connected to ${databaseName}`,
      "success",
      "database",
      { databaseName }
    )
  }

  async notifyError(title: string, message: string, category: Notification["category"]): Promise<Notification> {
    return this.createNotification(title, message, "error", category)
  }

  private playNotificationSound(type: Notification["type"]) {
    // In a real implementation, you would play actual audio files
    // For now, we'll just log the sound that would be played
    const sounds = {
      success: "success-chime",
      error: "error-sound", 
      warning: "warning-beep",
      info: "info-ping"
    }
    
    console.log(`🔊 Playing sound: ${sounds[type]}`)
    
    // Example of how you might implement this:
    // const audio = new Audio(`/sounds/${sounds[type]}.mp3`)
    // audio.play().catch(console.error)
  }

  formatTimestamp(timestamp: string): string {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMs = now.getTime() - notificationTime.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else {
      return notificationTime.toLocaleDateString()
    }
  }

  getCategoryIcon(category: Notification["category"]): string {
    const icons = {
      file: "📁",
      system: "⚙️", 
      auth: "🔐",
      share: "🔗",
      database: "🗄️",
      editor: "💻"
    }
    return icons[category] || "📋"
  }

  getCategoryColor(category: Notification["category"]): string {
    const colors = {
      file: "bg-blue-100 text-blue-800",
      system: "bg-gray-100 text-gray-800",
      auth: "bg-green-100 text-green-800", 
      share: "bg-purple-100 text-purple-800",
      database: "bg-orange-100 text-orange-800",
      editor: "bg-cyan-100 text-cyan-800"
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }
}
