"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthService } from "@/lib/auth-service"
import { type DbUser } from "@/lib/supabase"

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
    // Check for existing session on mount
    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
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

    return () => subscription.unsubscribe()
  }, [])

  const loadUser = async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const user = await AuthService.getCurrentUser()
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      })
    } catch (error) {
      console.error('Error loading user:', error)
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
      const { user } = await AuthService.signIn(email, password)

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
