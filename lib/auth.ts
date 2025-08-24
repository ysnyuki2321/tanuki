// Auth service - will be replaced with Supabase in production
export interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Mock user data for demo
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@tanuki.dev",
    name: "Admin User",
    role: "admin",
    avatar: "/admin-avatar.png",
  },
  {
    id: "2",
    email: "user@tanuki.dev",
    name: "Demo User",
    role: "user",
    avatar: "/diverse-user-avatars.png",
  },
]

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Production: integrate Supabase email/password sign-in here.
    // Temporary: allow configured admin user login for bootstrap
    if (email === "admin@tanuki.dev" && password === "Yuki@2321") {
      const adminUser: User = { id: "1", email, name: "Admin User", role: "admin", avatar: "/admin-avatar.png" }
      this.currentUser = adminUser
      if (typeof window !== "undefined") {
        localStorage.setItem("tanuki_user", JSON.stringify(adminUser))
      }
      return { user: adminUser, error: null }
    }

    return { user: null, error: "Invalid email or password" }
  }

  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
    // Production: Supabase sign-up with optional email confirmation (admin toggled)
    // Bootstrap: create local user session immediately
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: "user",
      avatar: "/abstract-user-avatar.png",
    }
    this.currentUser = newUser
    if (typeof window !== "undefined") {
      localStorage.setItem("tanuki_user", JSON.stringify(newUser))
    }
    return { user: newUser, error: null }
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem("tanuki_user")
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser

    // Check localStorage for persisted user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tanuki_user")
      if (stored) {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      }
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}
