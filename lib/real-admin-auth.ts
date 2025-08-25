// Real admin authentication service for platform configuration
// This is for actual project owners to configure the platform

interface RealAdminUser {
  id: string
  email: string
  password: string
  role: 'super_admin'
  full_name: string
  permissions: string[]
  created_at: string
  last_login: string | null
}

// Hardcoded admin credentials for project configuration
const REAL_ADMIN_USERS: RealAdminUser[] = [
  {
    id: 'real-admin-1',
    email: 'admin@tanuki.dev',
    password: 'Yuki@2321',
    role: 'super_admin',
    full_name: 'Platform Administrator',
    permissions: [
      'platform.configure',
      'database.setup', 
      'services.manage',
      'users.manage',
      'system.admin',
      'config.edit'
    ],
    created_at: new Date().toISOString(),
    last_login: null
  }
]

export interface AdminSession {
  user: Omit<RealAdminUser, 'password'>
  token: string
  expires: string
  permissions: string[]
}

export class RealAdminAuthService {
  private static readonly ADMIN_SESSION_KEY = 'tanuki_admin_session'
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  // Check if user is real admin
  static isRealAdmin(email: string): boolean {
    return REAL_ADMIN_USERS.some(admin => admin.email === email)
  }

  // Authenticate real admin
  static async authenticateAdmin(email: string, password: string): Promise<{
    success: boolean
    session?: AdminSession
    error?: string
  }> {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate auth delay

    const admin = REAL_ADMIN_USERS.find(u => u.email === email && u.password === password)

    if (!admin) {
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      }
    }

    // Create admin session
    const sessionUser = { ...admin }
    delete (sessionUser as any).password

    const session: AdminSession = {
      user: sessionUser,
      token: this.generateSessionToken(),
      expires: new Date(Date.now() + this.SESSION_DURATION).toISOString(),
      permissions: admin.permissions
    }

    // Store session
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(session))
        
        // Update last login
        admin.last_login = new Date().toISOString()
      } catch (error) {
        console.error('Failed to store admin session:', error)
        return { success: false, error: 'Session storage failed' }
      }
    }

    return { success: true, session }
  }

  // Get current admin session
  static getCurrentAdminSession(): AdminSession | null {
    if (typeof window === 'undefined') return null

    try {
      const sessionData = localStorage.getItem(this.ADMIN_SESSION_KEY)
      if (!sessionData) return null

      const session: AdminSession = JSON.parse(sessionData)
      
      // Check if session is expired
      if (new Date(session.expires) <= new Date()) {
        this.clearAdminSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get admin session:', error)
      return null
    }
  }

  // Check if current user has admin permission
  static hasAdminPermission(permission: string): boolean {
    const session = this.getCurrentAdminSession()
    if (!session) return false

    return session.permissions.includes(permission) || 
           session.permissions.includes('system.admin')
  }

  // Check if user is authenticated admin
  static isAuthenticatedAdmin(): boolean {
    const session = this.getCurrentAdminSession()
    return !!session
  }

  // Get current admin user
  static getCurrentAdminUser(): Omit<RealAdminUser, 'password'> | null {
    const session = this.getCurrentAdminSession()
    return session?.user || null
  }

  // Sign out admin
  static signOutAdmin(): void {
    this.clearAdminSession()
  }

  // Clear admin session
  private static clearAdminSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.ADMIN_SESSION_KEY)
      } catch (error) {
        console.error('Failed to clear admin session:', error)
      }
    }
  }

  // Generate session token
  private static generateSessionToken(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  // Refresh admin session
  static refreshAdminSession(): boolean {
    const session = this.getCurrentAdminSession()
    if (!session) return false

    // Extend session expiry
    session.expires = new Date(Date.now() + this.SESSION_DURATION).toISOString()

    try {
      localStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(session))
      return true
    } catch (error) {
      console.error('Failed to refresh admin session:', error)
      return false
    }
  }

  // Update admin configuration (for storing platform config)
  static async updatePlatformConfig(config: Record<string, any>): Promise<{
    success: boolean
    error?: string
  }> {
    if (!this.hasAdminPermission('config.edit')) {
      return { success: false, error: 'Insufficient permissions' }
    }

    try {
      // Store platform config in localStorage for now
      // In production, this would save to a secure backend
      const configKey = 'tanuki_platform_config'
      const existingConfig = JSON.parse(localStorage.getItem(configKey) || '{}')
      
      const updatedConfig = {
        ...existingConfig,
        ...config,
        updated_at: new Date().toISOString(),
        updated_by: this.getCurrentAdminUser()?.email
      }

      localStorage.setItem(configKey, JSON.stringify(updatedConfig))
      return { success: true }
    } catch (error) {
      console.error('Failed to update platform config:', error)
      return { success: false, error: 'Config update failed' }
    }
  }

  // Get platform configuration
  static getPlatformConfig(): Record<string, any> {
    try {
      const configKey = 'tanuki_platform_config'
      return JSON.parse(localStorage.getItem(configKey) || '{}')
    } catch (error) {
      console.error('Failed to get platform config:', error)
      return {}
    }
  }

  // Save Supabase configuration
  static async saveSupabaseConfig(config: {
    url: string
    anon_key: string
    service_key?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.hasAdminPermission('database.setup')) {
      return { success: false, error: 'Insufficient permissions' }
    }

    return await this.updatePlatformConfig({
      supabase_url: config.url,
      supabase_anon_key: config.anon_key,
      supabase_service_key: config.service_key,
      database_configured: true
    })
  }

  // Get Supabase configuration
  static getSupabaseConfig(): {
    url: string | null
    anon_key: string | null
    service_key: string | null
    configured: boolean
  } {
    const config = this.getPlatformConfig()
    return {
      url: config.supabase_url || null,
      anon_key: config.supabase_anon_key || null,
      service_key: config.supabase_service_key || null,
      configured: !!config.database_configured
    }
  }

  // Check if admin is configuring for the first time
  static isFirstTimeSetup(): boolean {
    const config = this.getPlatformConfig()
    return Object.keys(config).length === 0
  }

  // Get audit log of admin actions
  static getAdminAuditLog(): Array<{
    action: string
    timestamp: string
    admin: string
    details?: any
  }> {
    try {
      const logKey = 'tanuki_admin_audit_log'
      return JSON.parse(localStorage.getItem(logKey) || '[]')
    } catch {
      return []
    }
  }

  // Log admin action
  static logAdminAction(action: string, details?: any): void {
    const admin = this.getCurrentAdminUser()
    if (!admin) return

    try {
      const logKey = 'tanuki_admin_audit_log'
      const log = this.getAdminAuditLog()
      
      log.unshift({
        action,
        timestamp: new Date().toISOString(),
        admin: admin.email,
        details
      })

      // Keep only last 100 entries
      if (log.length > 100) {
        log.splice(100)
      }

      localStorage.setItem(logKey, JSON.stringify(log))
    } catch (error) {
      console.error('Failed to log admin action:', error)
    }
  }
}

export default RealAdminAuthService
