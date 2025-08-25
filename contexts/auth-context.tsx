"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthService } from "@/lib/auth-service"
import { type DbUser } from "@/lib/database-schema"
import { DemoAuthService } from "@/lib/demo-auth"
import { RealAdminAuthService } from "@/lib/real-admin-auth"

interface AuthState {
  user: DbUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: { full_name?: string; company?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<DbUser>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Initialize demo users if needed
    if (typeof window !== 'undefined') {
      DemoAuthService.initializeDemoUsers()
    }

    // Check for existing session on mount
    loadUser()

    // Listen for auth state changes (only if service is configured)
    let subscription: any = null

    try {
      const authStateChange = AuthService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUser()
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      })

      subscription = authStateChange?.data?.subscription
    } catch (error) {
      console.warn('Auth state listener setup failed (non-critical):', error)
      // Continue without auth state listener if setup fails
      setState(prev => ({ ...prev, isLoading: false }))
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const loadUser = async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // First check if there's a real admin session
      const adminUser = RealAdminAuthService.getCurrentAdminUser()
      if (adminUser) {
        setState({
          user: {
            ...adminUser,
            role: 'admin',
            tenant_id: null,
            storage_quota: null,
            file_count_limit: null,
            avatar_url: null,
            phone: null,
            company: null,
            email_verified: true,
            subscription_plan: null,
            subscription_status: null,
            subscription_expires: null,
            timezone: null,
            language: null,
            theme: null,
            updated_at: adminUser.created_at
          } as DbUser,
          isLoading: false,
          isAuthenticated: true,
        })
        return
      }

      // Check if auth service is configured
      if (!AuthService.isConfigured()) {
        console.warn('Auth service not configured - user will be treated as anonymous')
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return
      }

      const user = await AuthService.getCurrentUser()
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      })
    } catch (error) {
      console.warn('Error loading user (non-critical):', error)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await AuthService.signIn(email, password)
      const user = 'user' in result ? result.user : undefined

      if (user) {
        // Load full user profile
        await loadUser()
        return { success: true }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: "Sign in failed" }
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: error.message || "Sign in failed" }
    }
  }

  const signUp = async (email: string, password: string, metadata?: {
    full_name?: string
    company?: string
    phone?: string
  }) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { user } = await AuthService.signUp(email, password, metadata)

      if (user) {
        // Load full user profile
        await loadUser()
        return { success: true }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: "Sign up failed" }
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: error.message || "Sign up failed" }
    }
  }

  const signOut = async () => {
    await AuthService.signOut()
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Password reset failed" }
    }
  }

  const updateProfile = async (updates: Partial<DbUser>) => {
    if (!state.user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      await AuthService.updateUserProfile(state.user.id, updates)

      // Reload user data
      await loadUser()

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || "Profile update failed" }
    }
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
