"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mail, 
  Send, 
  Eye, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react'
import { EmailService, EmailTemplate } from '@/lib/email-service'
import { AdminConfigService } from '@/lib/admin-config'
import { toast } from 'sonner'

const EMAIL_TEMPLATES = [
  {
    key: 'email_verification',
    name: 'Email Verification',
    description: 'Sent when users need to verify their email address',
    variables: ['userName', 'verificationUrl']
  },
  {
    key: 'password_reset',
    name: 'Password Reset',
    description: 'Sent when users request a password reset',
    variables: ['userName', 'resetUrl']
  },
  {
    key: 'welcome',
    name: 'Welcome Email',
    description: 'Sent when users successfully verify their account',
    variables: ['userName', 'dashboardUrl']
  }
]

interface EmailTestData {
  email: string
  variables: Record<string, string>
}

export function EmailTemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState('email_verification')
  const [emailConfig, setEmailConfig] = useState<any>({})
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({})
  const [testData, setTestData] = useState<EmailTestData>({
    email: 'test@example.com',
    variables: {}
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')

  useEffect(() => {
    loadEmailConfig()
    generateTemplates()
  }, [])

  const loadEmailConfig = async () => {
    try {
      const configs = await AdminConfigService.getConfigValues('email')
      setEmailConfig(configs)
      testEmailConnection()
    } catch (error) {
      console.error('Failed to load email config:', error)
    }
  }

  const testEmailConnection = async () => {
    try {
      setTesting(true)
      const result = await EmailService.testConnection()
      setConnectionStatus(result.success ? 'connected' : 'error')
      
      if (!result.success) {
        toast.error(`Email connection failed: ${result.error}`)
      }
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setTesting(false)
    }
  }

  const generateTemplates = () => {
    const sampleData = {
      userName: 'John Doe',
      verificationUrl: 'https://tanuki.dev/auth/callback?token=sample-verification-token',
      resetUrl: 'https://tanuki.dev/auth/reset-password?token=sample-reset-token',
      dashboardUrl: 'https://tanuki.dev/dashboard'
    }

    const newTemplates: Record<string, EmailTemplate> = {
      email_verification: EmailService.generateEmailVerificationTemplate(
        'john.doe@example.com',
        sampleData.verificationUrl,
        sampleData.userName
      ),
      password_reset: EmailService.generatePasswordResetTemplate(
        'john.doe@example.com',
        sampleData.resetUrl,
        sampleData.userName
      ),
      welcome: EmailService.generateWelcomeTemplate(
        'john.doe@example.com',
        sampleData.userName
      )
    }

    setTemplates(newTemplates)

    // Initialize test data variables
    const template = EMAIL_TEMPLATES.find(t => t.key === selectedTemplate)
    if (template) {
      const initialVariables: Record<string, string> = {}
      template.variables.forEach(variable => {
        initialVariables[variable] = sampleData[variable as keyof typeof sampleData] || ''
      })
      setTestData(prev => ({ ...prev, variables: initialVariables }))
    }
  }

  const sendTestEmail = async () => {
    if (!testData.email) {
      toast.error('Please enter a test email address')
      return
    }

    setLoading(true)
    try {
      const template = templates[selectedTemplate]
      if (!template) {
        throw new Error('Template not found')
      }

      const result = await EmailService.sendEmail(testData.email, template, testData.variables)
      
      if (result.success) {
        toast.success('Test email sent successfully!')
      } else {
        toast.error(`Failed to send test email: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      toast.error('Failed to send test email')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    
    const template = EMAIL_TEMPLATES.find(t => t.key === templateKey)
    if (template) {
      const newVariables: Record<string, string> = {}
      template.variables.forEach(variable => {
        newVariables[variable] = testData.variables[variable] || ''
      })
      setTestData(prev => ({ ...prev, variables: newVariables }))
    }
  }

  const renderPreview = () => {
    const template = templates[selectedTemplate]
    if (!template) return null

    let content = previewMode === 'html' ? template.html : template.text

    // Replace variables for preview
    Object.entries(testData.variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, 'g'), value || `[${key}]`)
    })

    if (previewMode === 'html') {
      return (
        <div 
          className="border rounded-lg p-4 max-h-96 overflow-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    } else {
      return (
        <pre className="border rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm">
          {content}
        </pre>
      )
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Connection Error'
      default:
        return 'Checking...'
    }
  }

  const currentTemplate = EMAIL_TEMPLATES.find(t => t.key === selectedTemplate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage and test email templates for user notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {getConnectionStatusIcon()}
            <span className="text-sm">{getConnectionStatusText()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testEmailConnection}
            disabled={testing}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Email service is not properly configured. Please check your SMTP settings in the Email configuration section.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection and Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Template Configuration</span>
            </CardTitle>
            <CardDescription>
              Select and configure email templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentTemplate && (
                <p className="text-sm text-muted-foreground">
                  {currentTemplate.description}
                </p>
              )}
            </div>

            {/* Test Email Configuration */}
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address for testing"
              />
            </div>

            {/* Template Variables */}
            {currentTemplate && currentTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Template Variables</Label>
                <div className="space-y-2">
                  {currentTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={variable} className="text-sm">
                        {variable}
                      </Label>
                      <Input
                        id={variable}
                        value={testData.variables[variable] || ''}
                        onChange={(e) => setTestData(prev => ({
                          ...prev,
                          variables: {
                            ...prev.variables,
                            [variable]: e.target.value
                          }
                        }))}
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send Test Email */}
            <Button
              onClick={sendTestEmail}
              disabled={loading || connectionStatus === 'error' || !testData.email}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Template Preview</span>
                </CardTitle>
                <CardDescription>
                  Preview how the email will look
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {templates[selectedTemplate]?.subject || 'Loading...'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = templates[selectedTemplate]
                    if (template) {
                      copyToClipboard(previewMode === 'html' ? template.html : template.text)
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'html' | 'text')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html">HTML Preview</TabsTrigger>
                <TabsTrigger value="text">Text Version</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-4">
                {renderPreview()}
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                {renderPreview()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Usage Statistics</span>
          </CardTitle>
          <CardDescription>
            Overview of email sending activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Emails Sent Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Total Sent</div>
            </div>
          </div>
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Email statistics tracking will be available once the monitoring system is implemented.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailTemplateManager
