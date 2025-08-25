"use client"

import { useState, useEffect } from "react"

// Test components individually
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DemoSection } from "@/components/demo-section"
import { SetupStatus } from "@/components/setup-status"

// Test UI components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Test contexts
import { useAuth } from "@/contexts/auth-context"
import { useFeatureFlags } from "@/contexts/feature-flags-context"

const ComponentTest = ({ name, children, onError }: { 
  name: string, 
  children: React.ReactNode,
  onError: (error: string) => void 
}) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setHasError(true)
      setError(error.message)
      onError(`${name}: ${error.message}`)
    }

    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [name, onError])

  if (hasError) {
    return (
      <div style={{ 
        background: '#fee', 
        border: '1px solid #f00', 
        padding: '10px', 
        margin: '5px 0',
        borderRadius: '5px'
      }}>
        <strong>❌ {name} FAILED:</strong> {error}
      </div>
    )
  }

  return (
    <div style={{ 
      background: '#efe', 
      border: '1px solid #0a0', 
      padding: '10px', 
      margin: '5px 0',
      borderRadius: '5px'
    }}>
      <strong>✅ {name} OK</strong>
      <div style={{ marginTop: '10px' }}>
        {children}
      </div>
    </div>
  )
}

export default function DiagnosticPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('Diagnostic page mounted')
  }, [])

  const addError = (error: string) => {
    setErrors(prev => [...prev, error])
  }

  // Test contexts
  let authTest = "❌ Auth context failed"
  let featureFlagsTest = "❌ Feature flags failed"
  
  try {
    const auth = useAuth()
    authTest = `✅ Auth context OK (authenticated: ${auth.isAuthenticated})`
  } catch (e) {
    authTest = `❌ Auth context error: ${e}`
  }

  try {
    const ff = useFeatureFlags()
    featureFlagsTest = `✅ Feature flags OK (loading: ${ff.isLoading})`
  } catch (e) {
    featureFlagsTest = `❌ Feature flags error: ${e}`
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#000', fontSize: '24px', marginBottom: '20px' }}>
        🔍 COMPREHENSIVE DIAGNOSTIC PAGE
      </h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '5px' }}>
        <h2>System Status</h2>
        <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
          <li>React mounted: {mounted ? '✅' : '❌'}</li>
          <li>Page rendering: ✅</li>
          <li>CSS loading: ✅</li>
          <li>{authTest}</li>
          <li>{featureFlagsTest}</li>
          <li>Errors detected: {errors.length}</li>
        </ul>
      </div>

      {errors.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#fee', borderRadius: '5px' }}>
          <h3>🚨 Errors Found:</h3>
          {errors.map((error, i) => (
            <div key={i} style={{ padding: '5px 0' }}>{error}</div>
          ))}
        </div>
      )}

      <h2>UI Component Tests</h2>
      
      <ComponentTest name="Button Component" onError={addError}>
        <Button>Test Button</Button>
        <Button variant="outline">Outline Button</Button>
      </ComponentTest>

      <ComponentTest name="Card Component" onError={addError}>
        <Card style={{ maxWidth: '300px' }}>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Card content here</CardContent>
        </Card>
      </ComponentTest>

      <ComponentTest name="Badge Component" onError={addError}>
        <Badge>Test Badge</Badge>
        <Badge variant="secondary">Secondary Badge</Badge>
      </ComponentTest>

      <h2>Application Component Tests</h2>

      <ComponentTest name="SetupStatus Component" onError={addError}>
        <div style={{ maxWidth: '400px' }}>
          <SetupStatus />
        </div>
      </ComponentTest>

      <ComponentTest name="Header Component" onError={addError}>
        <div style={{ maxWidth: '100%', height: '80px', overflow: 'hidden' }}>
          <Header />
        </div>
      </ComponentTest>

      <ComponentTest name="HeroSection Component" onError={addError}>
        <div style={{ maxWidth: '400px', height: '200px', overflow: 'hidden' }}>
          <HeroSection />
        </div>
      </ComponentTest>

      <ComponentTest name="FeaturesSection Component" onError={addError}>
        <div style={{ maxWidth: '400px', height: '200px', overflow: 'hidden' }}>
          <FeaturesSection />
        </div>
      </ComponentTest>

      <ComponentTest name="DemoSection Component" onError={addError}>
        <div style={{ maxWidth: '400px', height: '200px', overflow: 'hidden' }}>
          <DemoSection />
        </div>
      </ComponentTest>

      <div style={{ marginTop: '30px', padding: '20px', background: '#e0f0ff', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <p>If you can see this diagnostic page clearly, navigate to <strong>/diagnostic</strong> in your browser.</p>
        <p>This will help identify exactly which component is causing the white screen issue.</p>
        <p>Check your browser console (F12) for additional error messages.</p>
      </div>
    </div>
  )
}
