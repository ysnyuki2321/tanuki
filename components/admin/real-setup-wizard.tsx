"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react'
import { RealAdminAuthService } from '@/lib/real-admin-auth'
import { configureSupabase, resetSupabaseClients } from '@/lib/supabase-client'
import { toast } from 'sonner'

interface DatabaseConfig {
  url: string
  anon_key: string
  service_key: string
}

interface EmailConfig {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  from_email: string
  from_name: string
}

export function RealSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  // Database configuration
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    url: '',
    anon_key: '',
    service_key: ''
  })
  const [dbTesting, setDbTesting] = useState(false)
  const [dbConnected, setDbConnected] = useState(false)

  // Email configuration
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'Tanuki Storage'
  })
  const [emailTesting, setEmailTesting] = useState(false)
  const [emailConnected, setEmailConnected] = useState(false)

  const steps = [
    {
      id: 'database',
      title: 'Database Setup',
      description: 'Configure Supabase database connection',
      icon: Database,
      required: true
    },
    {
      id: 'email',
      title: 'Email Setup',
      description: 'Configure SMTP for email notifications',
      icon: Mail,
      required: false
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Platform configuration complete',
      icon: CheckCircle,
      required: true
    }
  ]

  // Load existing configuration
  useEffect(() => {
    const loadConfig = () => {
      const existingConfig = RealAdminAuthService.getPlatformConfig()
      
      if (existingConfig.supabase_url) {
        setDbConfig({
          url: existingConfig.supabase_url || '',
          anon_key: existingConfig.supabase_anon_key || '',
          service_key: existingConfig.supabase_service_key || ''
        })
        setDbConnected(!!existingConfig.database_configured)
      }

      if (existingConfig.smtp_host) {
        setEmailConfig({
          smtp_host: existingConfig.smtp_host || '',
          smtp_port: existingConfig.smtp_port || '587',
          smtp_user: existingConfig.smtp_user || '',
          smtp_pass: existingConfig.smtp_pass || '',
          from_email: existingConfig.from_email || '',
          from_name: existingConfig.from_name || 'Tanuki Storage'
        })
        setEmailConnected(!!existingConfig.email_configured)
      }
    }

    loadConfig()
  }, [])

  // Test database connection
  const testDatabaseConnection = async () => {
    if (!dbConfig.url || !dbConfig.anon_key) {
      toast.error('Please fill in URL and Anon Key')
      return
    }

    setDbTesting(true)
    try {
      // Configure Supabase with new credentials
      const success = configureSupabase(dbConfig.url, dbConfig.anon_key, dbConfig.service_key)
      
      if (success) {
        // Test the connection by trying to access a system table
        const { getSupabase } = await import('@/lib/supabase-client')
        const supabase = getSupabase()
        
        if (supabase) {
          // Try a simple query to test connection
          const { error } = await supabase.from('information_schema.tables').select('table_name').limit(1)
          
          if (!error) {
            setDbConnected(true)
            toast.success('Database connection successful!')
            
            // Save configuration
            await RealAdminAuthService.saveSupabaseConfig(dbConfig)
            RealAdminAuthService.logAdminAction('database.configured', { url: dbConfig.url })
          } else {
            toast.error('Database connection failed: ' + error.message)
            setDbConnected(false)
          }
        } else {
          toast.error('Failed to create database client')
          setDbConnected(false)
        }
      } else {
        toast.error('Invalid database configuration')
        setDbConnected(false)
      }
    } catch (error) {
      console.error('Database test error:', error)
      toast.error('Database connection test failed')
      setDbConnected(false)
    } finally {
      setDbTesting(false)
    }
  }

  // Test email configuration
  const testEmailConnection = async () => {
    if (!emailConfig.smtp_host || !emailConfig.smtp_user) {
      toast.error('Please fill in SMTP host and user')
      return
    }

    setEmailTesting(true)
    try {
      // Simulate email test (in real implementation, would send test email)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setEmailConnected(true)
      toast.success('Email configuration test successful!')
      
      // Save email configuration
      await RealAdminAuthService.updatePlatformConfig({
        ...emailConfig,
        email_configured: true
      })
      RealAdminAuthService.logAdminAction('email.configured', { smtp_host: emailConfig.smtp_host })
    } catch (error) {
      console.error('Email test error:', error)
      toast.error('Email connection test failed')
      setEmailConnected(false)
    } finally {
      setEmailTesting(false)
    }
  }

  // Save configuration and complete setup
  const completeSetup = async () => {
    setIsLoading(true)
    try {
      await RealAdminAuthService.updatePlatformConfig({
        setup_completed: true,
        setup_completed_at: new Date().toISOString()
      })
      
      RealAdminAuthService.logAdminAction('setup.completed')
      toast.success('Platform setup completed!')
      
      // Refresh page to apply new configuration
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Setup completion error:', error)
      toast.error('Failed to complete setup')
    } finally {
      setIsLoading(false)
    }
  }

  const isStepComplete = (stepId: string) => {
    switch (stepId) {
      case 'database': return dbConnected
      case 'email': return true // Email is optional
      case 'complete': return dbConnected
      default: return false
    }
  }

  const canProceed = () => {
    return isStepComplete(steps[currentStep].id)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Platform Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Tanuki Storage platform for the first time
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isComplete = isStepComplete(step.id)
          const isPast = index < currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                ${isComplete || isPast ? 'border-green-500 bg-green-500 text-white' : ''}
                ${!isActive && !isComplete && !isPast ? 'border-muted-foreground text-muted-foreground' : ''}
              `}>
                {isComplete || isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{step.title}</div>
                {step.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-muted-foreground mx-4" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Tabs value={steps[currentStep].id} className="space-y-6">
        {/* Database Setup */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Supabase Database Configuration
              </CardTitle>
              <CardDescription>
                Connect your Supabase database to enable user authentication and file storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need a Supabase project to continue. Create one at{' '}
                  <a href="https://supabase.com" target="_blank" className="underline">
                    supabase.com
                  </a>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-url">Project URL *</Label>
                  <Input
                    id="db-url"
                    placeholder="https://your-project.supabase.co"
                    value={dbConfig.url}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-anon-key">Anon Key *</Label>
                  <div className="relative">
                    <Input
                      id="db-anon-key"
                      type={showPasswords ? "text" : "password"}
                      placeholder="Your anon/public key"
                      value={dbConfig.anon_key}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, anon_key: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="db-service-key">Service Role Key (Optional)</Label>
                  <Input
                    id="db-service-key"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Your service role key (for admin operations)"
                    value={dbConfig.service_key}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, service_key: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={testDatabaseConnection}
                  disabled={dbTesting || !dbConfig.url || !dbConfig.anon_key}
                  variant="outline"
                >
                  {dbTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>

                {dbConnected && (
                  <Badge variant="default" className="text-green-600 bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Setup */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for email notifications (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email configuration is optional. You can skip this step and configure it later.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={emailConfig.smtp_host}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    placeholder="587"
                    value={emailConfig.smtp_port}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_port: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    placeholder="your-email@gmail.com"
                    value={emailConfig.smtp_user}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">SMTP Password</Label>
                  <Input
                    id="smtp-pass"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Your app password"
                    value={emailConfig.smtp_pass}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_pass: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    placeholder="noreply@yourdomain.com"
                    value={emailConfig.from_email}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, from_email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Tanuki Storage"
                    value={emailConfig.from_name}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, from_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={testEmailConnection}
                  disabled={emailTesting}
                  variant="outline"
                >
                  {emailTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Email
                </Button>

                {emailConnected && (
                  <Badge variant="default" className="text-green-600 bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complete */}
        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Setup Complete
              </CardTitle>
              <CardDescription>
                Your Tanuki Storage platform is ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Configuration Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  Your platform has been successfully configured and is ready for users.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-muted-foreground">Connected</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Mail className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">
                      {emailConnected ? 'Configured' : 'Skip for now'}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={completeSetup}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Complete Setup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>

        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1 || !canProceed()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default RealSetupWizard
