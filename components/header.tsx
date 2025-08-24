"use client"

import { Button } from "@/components/ui/button"
import { TanukiLogo } from "./tanuki-logo"
import { Menu, X, Shield } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <TanukiLogo size={32} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">
              Demo
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#docs" className="text-sm font-medium hover:text-primary transition-colors">
              Docs
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="gradient-primary text-white">
                    Dashboard
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gradient-primary text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#demo" 
                className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Demo
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#docs" 
                className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="gradient-primary text-white w-full">
                        Dashboard
                      </Button>
                    </Link>
                    {user?.role === "admin" && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="gradient-primary text-white w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
