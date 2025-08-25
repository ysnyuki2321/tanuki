export interface SharePermission {
  canView: boolean
  canDownload: boolean
  canEdit: boolean
  canShare: boolean
  canComment: boolean
  expiresAt?: string
}

export interface ShareLink {
  id: string
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  shareUrl: string
  shortUrl: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  viewCount: number
  password?: string
  allowedDomains: string[]
  permissions: SharePermission
  isActive: boolean
  analytics: ShareAnalytics
  accessLog: ShareAccessLog[]
}

export interface ShareAnalytics {
  totalViews: number
  totalDownloads: number
  uniqueViewers: number
  lastAccessed?: string
  topCountries: { country: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
  deviceTypes: { type: string; count: number }[]
}

export interface ShareAccessLog {
  id: string
  shareId: string
  action: 'view' | 'download' | 'comment' | 'share'
  ipAddress: string
  userAgent: string
  country?: string
  referrer?: string
  timestamp: string
  success: boolean
  errorMessage?: string
  userId?: string
}

export interface ShareComment {
  id: string
  shareId: string
  userId?: string
  userName: string
  userEmail?: string
  content: string
  timestamp: string
  isEdited: boolean
  editedAt?: string
  parentId?: string // For replies
  reactions: { emoji: string; count: number; users: string[] }[]
}

export interface ShareNotification {
  id: string
  shareId: string
  type: 'new_comment' | 'download' | 'view' | 'expiring' | 'expired' | 'password_attempt'
  message: string
  timestamp: string
  read: boolean
  metadata: Record<string, any>
}

export interface BulkShareOptions {
  fileIds: string[]
  permissions: SharePermission
  expiresAt?: string
  password?: string
  allowedDomains: string[]
  notifyByEmail: boolean
  customMessage?: string
}

export interface ShareStatistics {
  totalShares: number
  activeShares: number
  expiredShares: number
  totalViews: number
  totalDownloads: number
  topSharedFiles: { fileName: string; shareCount: number }[]
  recentActivity: ShareAccessLog[]
}

export class SecureFileSharingService {
  private static instance: SecureFileSharingService
  private shares: ShareLink[] = []
  private comments: ShareComment[] = []
  private notifications: ShareNotification[] = []

  static getInstance(): SecureFileSharingService {
    if (!SecureFileSharingService.instance) {
      SecureFileSharingService.instance = new SecureFileSharingService()
      SecureFileSharingService.instance.initializeMockData()
    }
    return SecureFileSharingService.instance
  }

  private initializeMockData() {
    // Create some mock shares
    this.shares = [
      {
        id: 'share-1',
        fileId: 'file-1',
        fileName: 'project-proposal.pdf',
        fileSize: 2048576,
        mimeType: 'application/pdf',
        shareUrl: 'https://tanuki.dev/s/abc123def',
        shortUrl: 'https://tanuki.dev/s/abc123',
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        maxDownloads: 100,
        downloadCount: 23,
        viewCount: 156,
        password: 'secure123',
        allowedDomains: ['company.com', 'client.org'],
        permissions: {
          canView: true,
          canDownload: true,
          canEdit: false,
          canShare: false,
          canComment: true
        },
        isActive: true,
        analytics: {
          totalViews: 156,
          totalDownloads: 23,
          uniqueViewers: 89,
          lastAccessed: new Date().toISOString(),
          topCountries: [
            { country: 'United States', count: 67 },
            { country: 'Canada', count: 34 },
            { country: 'United Kingdom', count: 23 }
          ],
          topReferrers: [
            { referrer: 'email', count: 89 },
            { referrer: 'slack.com', count: 34 },
            { referrer: 'direct', count: 33 }
          ],
          deviceTypes: [
            { type: 'desktop', count: 89 },
            { type: 'mobile', count: 45 },
            { type: 'tablet', count: 22 }
          ]
        },
        accessLog: []
      },
      {
        id: 'share-2',
        fileId: 'file-2',
        fileName: 'database-backup.sql',
        fileSize: 15728640,
        mimeType: 'application/sql',
        shareUrl: 'https://tanuki.dev/s/xyz789ghi',
        shortUrl: 'https://tanuki.dev/s/xyz789',
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        downloadCount: 5,
        viewCount: 12,
        allowedDomains: [],
        permissions: {
          canView: true,
          canDownload: true,
          canEdit: false,
          canShare: false,
          canComment: false
        },
        isActive: true,
        analytics: {
          totalViews: 12,
          totalDownloads: 5,
          uniqueViewers: 8,
          lastAccessed: new Date(Date.now() - 1800000).toISOString(),
          topCountries: [
            { country: 'United States', count: 8 },
            { country: 'Germany', count: 4 }
          ],
          topReferrers: [
            { referrer: 'email', count: 12 }
          ],
          deviceTypes: [
            { type: 'desktop', count: 10 },
            { type: 'mobile', count: 2 }
          ]
        },
        accessLog: []
      }
    ]

    // Create some mock comments
    this.comments = [
      {
        id: 'comment-1',
        shareId: 'share-1',
        userId: 'user-2',
        userName: 'John Client',
        userEmail: 'john@client.org',
        content: 'Thanks for sharing this proposal. The timeline looks good!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isEdited: false,
        reactions: [
          { emoji: '👍', count: 2, users: ['user-1', 'user-3'] }
        ]
      },
      {
        id: 'comment-2',
        shareId: 'share-1',
        parentId: 'comment-1',
        userName: 'Sarah Manager',
        userEmail: 'sarah@company.com',
        content: 'Agreed! Should we schedule a meeting to discuss the next steps?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isEdited: false,
        reactions: []
      }
    ]

    // Create some mock notifications
    this.notifications = [
      {
        id: 'notif-1',
        shareId: 'share-1',
        type: 'new_comment',
        message: 'John Client commented on project-proposal.pdf',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        metadata: { userId: 'user-2', userName: 'John Client' }
      },
      {
        id: 'notif-2',
        shareId: 'share-1',
        type: 'download',
        message: 'project-proposal.pdf was downloaded 5 times today',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        metadata: { downloadCount: 5 }
      }
    ]
  }

  async createShare(
    fileId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    options: Partial<ShareLink>
  ): Promise<ShareLink> {
    const shareId = this.generateShareId()
    const shortCode = this.generateShortCode()
    
    const share: ShareLink = {
      id: shareId,
      fileId,
      fileName,
      fileSize,
      mimeType,
      shareUrl: `https://tanuki.dev/s/${shareId}`,
      shortUrl: `https://tanuki.dev/s/${shortCode}`,
      createdBy: options.createdBy || 'current-user',
      createdAt: new Date().toISOString(),
      expiresAt: options.expiresAt,
      maxDownloads: options.maxDownloads,
      downloadCount: 0,
      viewCount: 0,
      password: options.password,
      allowedDomains: options.allowedDomains || [],
      permissions: options.permissions || {
        canView: true,
        canDownload: true,
        canEdit: false,
        canShare: false,
        canComment: false
      },
      isActive: true,
      analytics: {
        totalViews: 0,
        totalDownloads: 0,
        uniqueViewers: 0,
        topCountries: [],
        topReferrers: [],
        deviceTypes: []
      },
      accessLog: []
    }

    this.shares.push(share)
    return share
  }

  async bulkCreateShares(options: BulkShareOptions): Promise<ShareLink[]> {
    const shares: ShareLink[] = []
    
    for (const fileId of options.fileIds) {
      // In a real implementation, you'd fetch file details from the file system
      const mockFile = {
        fileName: `file-${fileId}.txt`,
        fileSize: Math.floor(Math.random() * 10000000),
        mimeType: 'text/plain'
      }
      
      const share = await this.createShare(
        fileId,
        mockFile.fileName,
        mockFile.fileSize,
        mockFile.mimeType,
        {
          permissions: options.permissions,
          expiresAt: options.expiresAt,
          password: options.password,
          allowedDomains: options.allowedDomains,
          createdBy: 'current-user'
        }
      )
      
      shares.push(share)
    }

    if (options.notifyByEmail) {
      // In a real implementation, send email notifications
      console.log('Sending email notifications for bulk shares')
    }

    return shares
  }

  async getShare(shareId: string): Promise<ShareLink | null> {
    return this.shares.find(s => s.id === shareId) || null
  }

  async getShareByUrl(url: string): Promise<ShareLink | null> {
    return this.shares.find(s => s.shareUrl === url || s.shortUrl === url) || null
  }

  async getUserShares(userId: string): Promise<ShareLink[]> {
    return this.shares.filter(s => s.createdBy === userId)
  }

  async getAllShares(): Promise<ShareLink[]> {
    return [...this.shares]
  }

  async updateShare(shareId: string, updates: Partial<ShareLink>): Promise<boolean> {
    const shareIndex = this.shares.findIndex(s => s.id === shareId)
    if (shareIndex < 0) return false

    this.shares[shareIndex] = { ...this.shares[shareIndex], ...updates }
    return true
  }

  async deactivateShare(shareId: string): Promise<boolean> {
    return this.updateShare(shareId, { isActive: false })
  }

  async deleteShare(shareId: string): Promise<boolean> {
    const shareIndex = this.shares.findIndex(s => s.id === shareId)
    if (shareIndex < 0) return false

    this.shares.splice(shareIndex, 1)
    
    // Also delete related comments and notifications
    this.comments = this.comments.filter(c => c.shareId !== shareId)
    this.notifications = this.notifications.filter(n => n.shareId !== shareId)
    
    return true
  }

  async validateAccess(
    shareId: string,
    password?: string,
    userEmail?: string,
    ipAddress?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const share = await this.getShare(shareId)
    if (!share) {
      return { valid: false, reason: 'Share not found' }
    }

    if (!share.isActive) {
      return { valid: false, reason: 'Share is no longer active' }
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { valid: false, reason: 'Share has expired' }
    }

    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      return { valid: false, reason: 'Download limit reached' }
    }

    if (share.password && password !== share.password) {
      // Log failed password attempt
      this.logAccess(shareId, 'view', ipAddress || 'unknown', '', false, 'Invalid password')
      return { valid: false, reason: 'Invalid password' }
    }

    if (share.allowedDomains.length > 0 && userEmail) {
      const emailDomain = userEmail.split('@')[1]
      if (!share.allowedDomains.includes(emailDomain)) {
        return { valid: false, reason: 'Email domain not allowed' }
      }
    }

    return { valid: true }
  }

  async recordView(shareId: string, ipAddress: string, userAgent: string, referrer?: string): Promise<void> {
    const share = await this.getShare(shareId)
    if (!share) return

    share.viewCount += 1
    share.analytics.totalViews += 1
    share.analytics.lastAccessed = new Date().toISOString()

    // Update analytics
    this.updateAnalytics(share, ipAddress, userAgent, referrer, 'view')
    
    // Log access
    this.logAccess(shareId, 'view', ipAddress, userAgent, true, undefined, referrer)
  }

  async recordDownload(shareId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const share = await this.getShare(shareId)
    if (!share) return false

    if (!share.permissions.canDownload) {
      this.logAccess(shareId, 'download', ipAddress, userAgent, false, 'Download not permitted')
      return false
    }

    share.downloadCount += 1
    share.analytics.totalDownloads += 1
    share.analytics.lastAccessed = new Date().toISOString()

    // Update analytics
    this.updateAnalytics(share, ipAddress, userAgent, undefined, 'download')
    
    // Log access
    this.logAccess(shareId, 'download', ipAddress, userAgent, true)

    // Create notification for significant download milestones
    if (share.downloadCount % 10 === 0) {
      this.createNotification(shareId, 'download', 
        `${share.fileName} has been downloaded ${share.downloadCount} times`,
        { downloadCount: share.downloadCount }
      )
    }

    return true
  }

  private updateAnalytics(
    share: ShareLink, 
    ipAddress: string, 
    userAgent: string, 
    referrer: string | undefined, 
    action: 'view' | 'download'
  ) {
    // Update device types
    const deviceType = this.detectDeviceType(userAgent)
    const existingDevice = share.analytics.deviceTypes.find(d => d.type === deviceType)
    if (existingDevice) {
      existingDevice.count += 1
    } else {
      share.analytics.deviceTypes.push({ type: deviceType, count: 1 })
    }

    // Update referrers
    if (referrer) {
      const domain = this.extractDomain(referrer)
      const existingReferrer = share.analytics.topReferrers.find(r => r.referrer === domain)
      if (existingReferrer) {
        existingReferrer.count += 1
      } else {
        share.analytics.topReferrers.push({ referrer: domain, count: 1 })
      }
    }

    // Sort and limit analytics arrays
    share.analytics.deviceTypes.sort((a, b) => b.count - a.count)
    share.analytics.topReferrers.sort((a, b) => b.count - a.count).slice(0, 10)
  }

  private detectDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile'
    }
    return 'desktop'
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  private logAccess(
    shareId: string,
    action: ShareAccessLog['action'],
    ipAddress: string,
    userAgent: string,
    success: boolean,
    errorMessage?: string,
    referrer?: string,
    userId?: string
  ) {
    const log: ShareAccessLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shareId,
      action,
      ipAddress,
      userAgent,
      referrer,
      timestamp: new Date().toISOString(),
      success,
      errorMessage,
      userId
    }

    const share = this.shares.find(s => s.id === shareId)
    if (share) {
      share.accessLog.push(log)
      
      // Keep only last 1000 log entries per share
      if (share.accessLog.length > 1000) {
        share.accessLog = share.accessLog.slice(-1000)
      }
    }
  }

  // Comments functionality
  async addComment(
    shareId: string,
    content: string,
    userName: string,
    userEmail?: string,
    userId?: string,
    parentId?: string
  ): Promise<ShareComment> {
    const comment: ShareComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shareId,
      userId,
      userName,
      userEmail,
      content,
      timestamp: new Date().toISOString(),
      isEdited: false,
      parentId,
      reactions: []
    }

    this.comments.push(comment)

    // Create notification
    this.createNotification(shareId, 'new_comment',
      `${userName} commented on the shared file`,
      { userId, userName, commentId: comment.id }
    )

    return comment
  }

  async getComments(shareId: string): Promise<ShareComment[]> {
    return this.comments
      .filter(c => c.shareId === shareId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  async addReaction(commentId: string, emoji: string, userId: string): Promise<boolean> {
    const comment = this.comments.find(c => c.id === commentId)
    if (!comment) return false

    const existingReaction = comment.reactions.find(r => r.emoji === emoji)
    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        // Remove reaction
        existingReaction.users = existingReaction.users.filter(u => u !== userId)
        existingReaction.count -= 1
        if (existingReaction.count === 0) {
          comment.reactions = comment.reactions.filter(r => r.emoji !== emoji)
        }
      } else {
        // Add reaction
        existingReaction.users.push(userId)
        existingReaction.count += 1
      }
    } else {
      // New reaction
      comment.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      })
    }

    return true
  }

  // Notifications
  private createNotification(
    shareId: string,
    type: ShareNotification['type'],
    message: string,
    metadata: Record<string, any> = {}
  ) {
    const notification: ShareNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shareId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      metadata
    }

    this.notifications.push(notification)
  }

  async getNotifications(userId: string): Promise<ShareNotification[]> {
    // In a real implementation, filter by user's shares
    return this.notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (!notification) return false

    notification.read = true
    return true
  }

  // Analytics and statistics
  async getShareStatistics(userId?: string): Promise<ShareStatistics> {
    const userShares = userId ? this.shares.filter(s => s.createdBy === userId) : this.shares
    
    return {
      totalShares: userShares.length,
      activeShares: userShares.filter(s => s.isActive).length,
      expiredShares: userShares.filter(s => 
        s.expiresAt && new Date(s.expiresAt) < new Date()
      ).length,
      totalViews: userShares.reduce((sum, s) => sum + s.viewCount, 0),
      totalDownloads: userShares.reduce((sum, s) => sum + s.downloadCount, 0),
      topSharedFiles: userShares
        .map(s => ({ fileName: s.fileName, shareCount: s.viewCount + s.downloadCount }))
        .sort((a, b) => b.shareCount - a.shareCount)
        .slice(0, 10),
      recentActivity: userShares
        .flatMap(s => s.accessLog)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50)
    }
  }

  // Utility methods
  private generateShareId(): string {
    return `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateShortCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Cleanup expired shares
  async cleanupExpiredShares(): Promise<number> {
    const now = new Date()
    const expiredShares = this.shares.filter(s => 
      s.expiresAt && new Date(s.expiresAt) < now
    )

    for (const share of expiredShares) {
      share.isActive = false
      this.createNotification(share.id, 'expired',
        `Share for ${share.fileName} has expired`,
        { fileName: share.fileName }
      )
    }

    return expiredShares.length
  }

  // Security features
  async getSecurityReport(shareId: string): Promise<{
    suspiciousActivity: ShareAccessLog[]
    passwordAttempts: ShareAccessLog[]
    geographicDistribution: { country: string; count: number }[]
  }> {
    const share = await this.getShare(shareId)
    if (!share) {
      return {
        suspiciousActivity: [],
        passwordAttempts: [],
        geographicDistribution: []
      }
    }

    const passwordAttempts = share.accessLog.filter(log => 
      !log.success && log.errorMessage?.includes('password')
    )

    const suspiciousActivity = share.accessLog.filter(log => {
      // Define suspicious patterns
      const highFrequency = share.accessLog.filter(l => 
        l.ipAddress === log.ipAddress && 
        Math.abs(new Date(l.timestamp).getTime() - new Date(log.timestamp).getTime()) < 60000
      ).length > 10

      return highFrequency || !log.success
    })

    return {
      suspiciousActivity,
      passwordAttempts,
      geographicDistribution: share.analytics.topCountries
    }
  }
}
