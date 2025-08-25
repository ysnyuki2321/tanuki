// Mock authentication service - replace with real implementation later
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
    // Input validation
    if (!email || !password) {
      return { user: null, error: "Email and password are required" }
    }

    if (!this.isValidEmail(email)) {
      return { user: null, error: "Please enter a valid email address" }
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return { user: null, error: "No account found with this email address" }
    }

    if (password !== "demo123") {
      return { user: null, error: "Incorrect password. Please try again." }
    }

    this.currentUser = user
    localStorage.setItem("tanuki_user", JSON.stringify(user))
    return { user, error: null }
  }

  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
    // Mock registration - replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (mockUsers.find((u) => u.email === email)) {
      return { user: null, error: "Email already exists" }
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: "user",
      avatar: "/abstract-user-avatar.png",
    }

    mockUsers.push(newUser)
    this.currentUser = newUser
    localStorage.setItem("tanuki_user", JSON.stringify(newUser))
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
