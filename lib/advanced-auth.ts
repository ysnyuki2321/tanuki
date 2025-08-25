export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  status: 'active' | 'suspended' | 'pending' | 'deactivated'
  emailVerified: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
  subscription: UserSubscription
  profile: UserProfile
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    fileSharing: boolean
    storageAlerts: boolean
    securityAlerts: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    shareAnalytics: boolean
    allowIndexing: boolean
  }
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'enterprise'
  storageLimit: number
  storageUsed: number
  expiresAt?: string
  features: string[]
}

export interface UserProfile {
  bio?: string
  website?: string
  company?: string
  location?: string
  timezone?: string
  socialLinks: {
    github?: string
    twitter?: string
    linkedin?: string
  }
}

export interface AuthSession {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  location?: string
  isActive: boolean
  createdAt: string
}

export interface LoginAttempt {
  id: string
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  failureReason?: string
  timestamp: string
  location?: string
}

export interface PasswordReset {
  id: string
  email: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export interface TwoFactorAuth {
  enabled: boolean
  secret?: string
  backupCodes: string[]
  lastUsed?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  session?: AuthSession
  error?: string
  requiresTwoFactor?: boolean
  requiresEmailVerification?: boolean
}

export interface RegisterData {
  email: string
  password: string
  name: string
  agreeToTerms: boolean
  marketingOptIn?: boolean
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
  twoFactorCode?: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@tanuki.dev',
    name: 'Admin User',
    avatar: '/placeholder.svg',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    twoFactorEnabled: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        desktop: true,
        fileSharing: true,
        storageAlerts: true,
        securityAlerts: true
      },
      privacy: {
        profileVisibility: 'private',
        shareAnalytics: false,
        allowIndexing: false
      }
    },
    subscription: {
      plan: 'enterprise',
      storageLimit: 100000000000, // 100GB
      storageUsed: 25000000000, // 25GB
      features: ['unlimited_sharing', 'advanced_editor', 'database_gui', 'priority_support']
    },
    profile: {
      bio: 'System Administrator',
      company: 'Tanuki Technologies',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles',
      socialLinks: {
        github: 'tanuki-admin',
        twitter: 'tanuki_dev'
      }
    }
  },
  {
    id: 'user-2',
    email: 'user@tanuki.dev',
    name: 'John Doe',
    avatar: '/placeholder.svg',
    role: 'user',
    status: 'active',
    emailVerified: true,
    twoFactorEnabled: false,
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        desktop: false,
        fileSharing: true,
        storageAlerts: true,
        securityAlerts: true
      },
      privacy: {
        profileVisibility: 'public',
        shareAnalytics: true,
        allowIndexing: true
      }
    },
    subscription: {
      plan: 'pro',
      storageLimit: 50000000000, // 50GB
      storageUsed: 12000000000, // 12GB
      expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      features: ['advanced_editor', 'priority_support']
    },
    profile: {
      bio: 'Full-stack developer passionate about building great software',
      website: 'https://johndoe.dev',
      company: 'Tech Startup Inc.',
      location: 'New York, NY',
      timezone: 'America/New_York',
      socialLinks: {
        github: 'johndoe',
        twitter: 'john_doe_dev',
        linkedin: 'john-doe-dev'
      }
    }
  }
]

const mockSessions: AuthSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    token: 'token-123',
    refreshToken: 'refresh-123',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    location: 'San Francisco, CA',
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

export class AdvancedAuthService {
  private static instance: AdvancedAuthService
  private currentUser: User | null = null
  private currentSession: AuthSession | null = null

  static getInstance(): AdvancedAuthService {
    if (!AdvancedAuthService.instance) {
      AdvancedAuthService.instance = new AdvancedAuthService()
    }
    return AdvancedAuthService.instance
  }

  constructor() {
    this.loadStoredSession()
  }

  private loadStoredSession() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tanuki_auth')
      if (stored) {
        try {
          const { user, session } = JSON.parse(stored)
          if (new Date(session.expiresAt) > new Date()) {
            this.currentUser = user
            this.currentSession = session
          } else {
            localStorage.removeItem('tanuki_auth')
          }
        } catch (error) {
          localStorage.removeItem('tanuki_auth')
        }
      }
    }
  }

  private storeSession(user: User, session: AuthSession) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tanuki_auth', JSON.stringify({ user, session }))
    }
    this.currentUser = user
    this.currentSession = session
  }

  private clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tanuki_auth')
    }
    this.currentUser = null
    this.currentSession = null
  }

  async register(data: RegisterData): Promise<AuthResult> {
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === data.email)
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists'
      }
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'user',
      status: 'pending', // Requires email verification
      emailVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          desktop: false,
          fileSharing: true,
          storageAlerts: true,
          securityAlerts: true
        },
        privacy: {
          profileVisibility: 'public',
          shareAnalytics: data.marketingOptIn || false,
          allowIndexing: true
        }
      },
      subscription: {
        plan: 'free',
        storageLimit: 5000000000, // 5GB
        storageUsed: 0,
        features: []
      },
      profile: {
        socialLinks: {}
      }
    }

    mockUsers.push(newUser)

    return {
      success: true,
      user: newUser,
      requiresEmailVerification: true
    }
  }

  async login(data: LoginData): Promise<AuthResult> {
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = mockUsers.find(u => u.email === data.email)
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact support.'
      }
    }

    if (user.status === 'deactivated') {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      }
    }

    if (!user.emailVerified) {
      return {
        success: false,
        requiresEmailVerification: true,
        error: 'Please verify your email address before logging in'
      }
    }

    if (user.twoFactorEnabled && !data.twoFactorCode) {
      return {
        success: false,
        requiresTwoFactor: true,
        error: 'Two-factor authentication code required'
      }
    }

    // Create session
    const session: AuthSession = {
      id: `session-${Date.now()}`,
      userId: user.id,
      token: `token-${Date.now()}`,
      refreshToken: `refresh-${Date.now()}`,
      expiresAt: new Date(Date.now() + (data.rememberMe ? 86400000 * 30 : 86400000)).toISOString(),
      ipAddress: '192.168.1.100', // Would be real IP
      userAgent: 'Mozilla/5.0', // Would be real user agent
      location: 'Unknown', // Would be real location
      isActive: true,
      createdAt: new Date().toISOString()
    }

    // Update user last login
    user.lastLoginAt = new Date().toISOString()

    this.storeSession(user, session)

    return {
      success: true,
      user,
      session
    }
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (this.currentSession) {
      // Mark session as inactive
      const sessionIndex = mockSessions.findIndex(s => s.id === this.currentSession!.id)
      if (sessionIndex >= 0) {
        mockSessions[sessionIndex].isActive = false
      }
    }

    this.clearSession()
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession
  }

  async updateProfile(updates: Partial<User>): Promise<AuthResult> {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update user in mock data
    const userIndex = mockUsers.findIndex(u => u.id === this.currentUser!.id)
    if (userIndex >= 0) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates, updatedAt: new Date().toISOString() }
      this.currentUser = mockUsers[userIndex]
      
      // Update stored session
      if (this.currentSession) {
        this.storeSession(this.currentUser, this.currentSession)
      }
    }

    return {
      success: true,
      user: this.currentUser
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800))

    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // In a real implementation, verify current password
    // For demo, just simulate success
    return { success: true }
  }

  async enableTwoFactor(): Promise<{ success: boolean; secret?: string; qrCode?: string; backupCodes?: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (!this.currentUser) {
      return { success: false }
    }

    const secret = 'JBSWY3DPEHPK3PXP' // Would be generated
    const backupCodes = [
      '12345678', '87654321', '11111111', '22222222', '33333333',
      '44444444', '55555555', '66666666', '77777777', '88888888'
    ]

    // Update user
    await this.updateProfile({
      twoFactorEnabled: true
    })

    return {
      success: true,
      secret,
      qrCode: `otpauth://totp/Tanuki:${this.currentUser.email}?secret=${secret}&issuer=Tanuki`,
      backupCodes
    }
  }

  async disableTwoFactor(code: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify code (simplified for demo)
    if (code.length !== 6) {
      return { success: false, error: 'Invalid two-factor code' }
    }

    await this.updateProfile({
      twoFactorEnabled: false
    })

    return { success: true }
  }

  async getUserSessions(): Promise<AuthSession[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!this.currentUser) {
      return []
    }

    return mockSessions.filter(s => s.userId === this.currentUser!.id)
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId)
    if (sessionIndex >= 0) {
      mockSessions[sessionIndex].isActive = false
    }

    return { success: true }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      // Don't reveal if email exists for security
      return { success: true }
    }

    // In real implementation, send email with reset link
    console.log(`Password reset email sent to ${email}`)

    return { success: true }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))

    // In real implementation, verify token
    // For demo, just mark as verified
    if (this.currentUser && !this.currentUser.emailVerified) {
      await this.updateProfile({
        emailVerified: true,
        status: 'active'
      })
    }

    return { success: true }
  }

  async resendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    if (this.currentUser.emailVerified) {
      return { success: false, error: 'Email is already verified' }
    }

    // In real implementation, send verification email
    console.log(`Verification email sent to ${this.currentUser.email}`)

    return { success: true }
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    return mockUsers
  }

  async updateUserStatus(userId: string, status: User['status']): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex >= 0) {
      mockUsers[userIndex].status = status
      mockUsers[userIndex].updatedAt = new Date().toISOString()
    }

    return { success: true }
  }

  async updateUserRole(userId: string, role: User['role']): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex >= 0) {
      mockUsers[userIndex].role = role
      mockUsers[userIndex].updatedAt = new Date().toISOString()
    }

    return { success: true }
  }

  async getLoginAttempts(limit = 50): Promise<LoginAttempt[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    // Mock login attempts
    const attempts: LoginAttempt[] = [
      {
        id: '1',
        email: 'admin@tanuki.dev',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        success: true,
        timestamp: new Date().toISOString(),
        location: 'San Francisco, CA'
      },
      {
        id: '2',
        email: 'hacker@evil.com',
        ipAddress: '10.0.0.1',
        userAgent: 'curl/7.68.0',
        success: false,
        failureReason: 'Invalid credentials',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        location: 'Unknown'
      }
    ]

    return attempts.slice(0, limit)
  }
}
