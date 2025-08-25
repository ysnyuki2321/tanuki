"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Shield, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ArrowRight
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase-client'
import { DemoAuthService } from '@/lib/demo-auth'

export function SetupStatus() {
  const [isDemo, setIsDemo] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const checkStatus = () => {
      const configured = isSupabaseConfigured()
      const demo = !configured && DemoAuthService.isDemoMode()
      
      setIsConfigured(configured)
      setIsDemo(demo)
    }

    checkStatus()
  }, [])

  const setupItems = [
    {
      name: 'Database',
      key: 'database',
      icon: Database,
      configured: isConfigured,
      required: true,
      description: isConfigured 
        ? 'Supabase database connected' 
        : 'Database connection required for production',
      action: '/admin?tab=database'
    },
    {
      name: 'Authentication',
      key: 'auth',
      icon: Shield,
      configured: isConfigured || isDemo,
      required: true,
      description: isDemo 
        ? 'Demo authentication active' 
        : isConfigured 
          ? 'Authentication configured'
          : 'Authentication setup required',
      action: isDemo ? null : '/admin?tab=auth'
    },
    {
      name: 'Configuration',
      key: 'config',
      icon: Settings,
      configured: true, // Config always works
      required: true,
      description: 'App configuration loaded',
      action: '/admin'
    }
  ]

  const configuredCount = setupItems.filter(item => item.configured).length
  const totalCount = setupItems.length
  const progress = (configuredCount / totalCount) * 100

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Status
            </CardTitle>
            <CardDescription>
              {isDemo ? 'Demo Mode Active' : `${configuredCount}/${totalCount} services configured`}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDemo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> You're using the platform in demo mode. 
              Connect a database to enable full functionality.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {setupItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    item.configured 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.configured ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                      {item.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                {!item.configured && item.action && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.action}>
                      Setup <ArrowRight className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {!isConfigured && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Production Setup:</strong> Connect to Supabase to enable 
              real user authentication, file storage, and data persistence.
              <br />
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/admin">Configure Database →</a>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default SetupStatus
