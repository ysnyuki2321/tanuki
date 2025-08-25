// Demo authentication service for white-label platform
// Works without database - stores users in localStorage for demo purposes

import type { DbUser } from './database-schema'

interface DemoUser extends Omit<DbUser, 'id' | 'created_at' | 'updated_at'> {
  id: string
  password?: string // Only for demo - never store in real DB
  created_at: string
  updated_at: string
}

// Demo users for showcase
const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-admin-1',
    email: 'admin@tanuki.dev',
    password: 'Yuki@2321',
    full_name: 'Admin User',
    avatar_url: null,
    phone: null,
    company: 'Tanuki Corp',
    email_verified: true,
    role: 'admin',
    storage_quota: 10737418240, // 10GB
    file_count_limit: 10000,
    tenant_id: null,
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    subscription_expires: null,
    last_login: null,
    timezone: 'UTC',
    language: 'en',
    theme: 'light',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-user-1',
    email: 'user@tanuki.dev',
    password: 'demo123',
    full_name: 'Demo User',
    avatar_url: null,
    phone: '+1-555-0123',
    company: 'Demo Company',
    email_verified: true,
    role: 'user',
    storage_quota: 1073741824, // 1GB
    file_count_limit: 1000,
    tenant_id: null,
    subscription_plan: 'basic',
    subscription_status: 'active',
    subscription_expires: null,
    last_login: null,
    timezone: 'UTC',
    language: 'en',
    theme: 'light',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export class DemoAuthService {
  private static readonly STORAGE_KEY = 'tanuki_demo_session'
  private static readonly USERS_KEY = 'tanuki_demo_users'

  // Initialize demo users in localStorage
  static initializeDemoUsers() {
    if (typeof window === 'undefined') return

    const existingUsers = localStorage.getItem(this.USERS_KEY)
    if (!existingUsers) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(DEMO_USERS))
    }
  }

  // Get demo users from localStorage
  static getDemoUsers(): DemoUser[] {
    if (typeof window === 'undefined') return DEMO_USERS

    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users) : DEMO_USERS
    } catch {
      return DEMO_USERS
    }
  }

  // Save demo users to localStorage
  static saveDemoUsers(users: DemoUser[]) {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.warn('Failed to save demo users:', error)
    }
  }

  // Get current session
  static getCurrentSession(): { user: Omit<DemoUser, 'password'> | null } {
    if (typeof window === 'undefined') return { user: null }

    try {
      const session = localStorage.getItem(this.STORAGE_KEY)
      if (session) {
        const { user, expires } = JSON.parse(session)
        if (new Date(expires) > new Date()) {
          return { user }
        } else {
          // Session expired
          this.signOut()
        }
      }
    } catch (error) {
      console.warn('Failed to get session:', error)
    }

    return { user: null }
  }

  // Sign in with email/password
  static async signIn(email: string, password: string): Promise<{
    success: boolean
    user?: Omit<DemoUser, 'password'>
    error?: string
  }> {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay

    this.initializeDemoUsers()
    const users = this.getDemoUsers()
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Create session
    const sessionUser = { ...user }
    delete (sessionUser as any).password

    const session = {
      user: sessionUser,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))

      // Update last login
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, last_login: new Date().toISOString(), updated_at: new Date().toISOString() }
          : u
      )
      this.saveDemoUsers(updatedUsers)

      return { success: true, user: sessionUser }
    } catch (error) {
      return { success: false, error: 'Failed to create session' }
    }
  }

  // Sign up new user
  static async signUp(email: string, password: string, metadata?: {
    full_name?: string
    company?: string
    phone?: string
  }): Promise<{
    success: boolean
    user?: Omit<DemoUser, 'password'>
    error?: string
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay

    this.initializeDemoUsers()
    const users = this.getDemoUsers()

    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Create new user
    const newUser: DemoUser = {
      id: `demo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      email,
      password,
      full_name: metadata?.full_name || null,
      avatar_url: null,
      phone: metadata?.phone || null,
      company: metadata?.company || null,
      email_verified: true, // Auto-verify in demo
      role: 'user',
      storage_quota: 1073741824, // 1GB default
      file_count_limit: 1000,
      tenant_id: null,
      subscription_plan: 'basic',
      subscription_status: 'active',
      subscription_expires: null,
      last_login: null,
      timezone: 'UTC',
      language: 'en',
      theme: 'light',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save new user
    const updatedUsers = [...users, newUser]
    this.saveDemoUsers(updatedUsers)

    // Create session
    const sessionUser = { ...newUser }
    delete (sessionUser as any).password

    const session = {
      user: sessionUser,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
      return { success: true, user: sessionUser }
    } catch (error) {
      return { success: false, error: 'Failed to create session' }
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to sign out:', error)
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<Omit<DemoUser, 'password'> | null> {
    const session = this.getCurrentSession()
    return session.user
  }

  // Update user profile
  static async updateProfile(updates: Partial<Omit<DemoUser, 'id' | 'email' | 'password'>>): Promise<{
    success: boolean
    user?: Omit<DemoUser, 'password'>
    error?: string
  }> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    this.initializeDemoUsers()
    const users = this.getDemoUsers()
    
    const updatedUsers = users.map(u => 
      u.id === currentUser.id 
        ? { ...u, ...updates, updated_at: new Date().toISOString() }
        : u
    )

    this.saveDemoUsers(updatedUsers)

    // Update session
    const updatedUser = updatedUsers.find(u => u.id === currentUser.id)
    if (updatedUser) {
      const sessionUser = { ...updatedUser }
      delete (sessionUser as any).password

      const session = {
        user: sessionUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
        return { success: true, user: sessionUser }
      } catch (error) {
        return { success: false, error: 'Failed to update session' }
      }
    }

    return { success: false, error: 'User not found' }
  }

  // Reset password (demo - just change password)
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))

    this.initializeDemoUsers()
    const users = this.getDemoUsers()
    const userExists = users.some(u => u.email === email)

    if (!userExists) {
      return { success: false, error: 'No user found with this email' }
    }

    // In demo, we just return success (would send email in real implementation)
    return { success: true }
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    this.initializeDemoUsers()
    const users = this.getDemoUsers()
    const user = users.find(u => u.id === currentUser.id)

    if (!user || user.password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const updatedUsers = users.map(u => 
      u.id === currentUser.id 
        ? { ...u, password: newPassword, updated_at: new Date().toISOString() }
        : u
    )

    this.saveDemoUsers(updatedUsers)
    return { success: true }
  }

  // List all users (admin only)
  static async listUsers(): Promise<Omit<DemoUser, 'password'>[]> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return []
    }

    this.initializeDemoUsers()
    const users = this.getDemoUsers()
    return users.map(u => {
      const user = { ...u }
      delete (user as any).password
      return user
    })
  }

  // Check if demo mode is active
  static isDemoMode(): boolean {
    return typeof window !== 'undefined'
  }

  // Clear all demo data
  static clearDemoData(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.USERS_KEY)
    } catch (error) {
      console.warn('Failed to clear demo data:', error)
    }
  }
}

export default DemoAuthService
