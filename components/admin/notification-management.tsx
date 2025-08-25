"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  SMTPService, 
  NotificationService, 
  type SMTPConfig, 
  type EmailTemplate, 
  type NotificationRule,
  type EmailNotification,
  type NotificationEvent
} from "@/lib/smtp"
import { 
  Mail, 
  Plus, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  Edit,
  Trash2,
  Send,
  AlertTriangle
} from "lucide-react"

export function NotificationManagement() {
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [emailQueue, setEmailQueue] = useState<EmailNotification[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [showSMTPDialog, setShowSMTPDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)

  const [smtpForm, setSMTPForm] = useState({
    host: "",
    port: "587",
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Tanuki Storage"
  })

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    htmlBody: "",
    textBody: "",
    variables: [] as string[]
  })

  const [ruleForm, setRuleForm] = useState({
    name: "",
    event: "server_offline" as NotificationEvent,
    recipients: "",
    templateId: "",
    enabled: true
  })

  const smtpService = SMTPService.getInstance()
  const notificationService = NotificationService.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setSMTPConfig(smtpService.getConfig())
    setTemplates(notificationService.getTemplates())
    setRules(notificationService.getRules())
    setEmailQueue(smtpService.getEmailQueue())
  }

  const handleSMTPSave = async () => {
    const config: SMTPConfig = {
      ...smtpForm,
      port: parseInt(smtpForm.port)
    }
    
    const success = smtpService.configure(config)
    if (success) {
      setSMTPConfig(config)
      setShowSMTPDialog(false)
    }
  }

  const handleTestSMTP = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    const result = await smtpService.testConnection()
    setTestResult(result)
    setIsTesting(false)
  }

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      notificationService.updateTemplate(editingTemplate.id, templateForm)
    } else {
      notificationService.addTemplate(templateForm)
    }
    
    setShowTemplateDialog(false)
    setEditingTemplate(null)
    setTemplateForm({
      name: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      variables: []
    })
    loadData()
  }

  const handleSaveRule = () => {
    const ruleData = {
      ...ruleForm,
      recipients: ruleForm.recipients.split(',').map(email => email.trim())
    }
    
    if (editingRule) {
      notificationService.updateRule(editingRule.id, ruleData)
    } else {
      notificationService.addRule(ruleData)
    }
    
    setShowRuleDialog(false)
    setEditingRule(null)
    setRuleForm({
      name: "",
      event: "server_offline",
      recipients: "",
      templateId: "",
      enabled: true
    })
    loadData()
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      variables: template.variables
    })
    setShowTemplateDialog(true)
  }

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      event: rule.event,
      recipients: rule.recipients.join(', '),
      templateId: rule.templateId,
      enabled: rule.enabled
    })
    setShowRuleDialog(true)
  }

  const handleTestNotification = async () => {
    await notificationService.sendNotification('server_offline', {
      serverName: 'Test Server',
      serverHost: '192.168.1.100',
      timestamp: new Date().toLocaleString(),
      lastPing: '2 minutes ago'
    })
    
    // Refresh email queue
    setTimeout(() => {
      setEmailQueue(smtpService.getEmailQueue())
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Management</h2>
          <p className="text-muted-foreground">Cấu hình SMTP và quản lý thông báo</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleTestNotification}>
            <Send className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp">SMTP Config</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="rules">Notification Rules</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
        </TabsList>

        {/* SMTP Configuration */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>
                    Cấu hình máy chủ email để gửi thông báo
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {smtpConfig && (
                    <Button variant="outline" onClick={handleTestSMTP} disabled={isTesting}>
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  )}
                  <Dialog open={showSMTPDialog} onOpenChange={setShowSMTPDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        {smtpConfig ? 'Edit Config' : 'Setup SMTP'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>SMTP Configuration</DialogTitle>
                        <DialogDescription>
                          Cấu hình thông tin máy chủ email
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="host">SMTP Host</Label>
                            <Input
                              id="host"
                              value={smtpForm.host}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, host: e.target.value }))}
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input
                              id="port"
                              type="number"
                              value={smtpForm.port}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, port: e.target.value }))}
                              placeholder="587"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="secure"
                            checked={smtpForm.secure}
                            onCheckedChange={(checked) => setSMTPForm(prev => ({ ...prev, secure: checked }))}
                          />
                          <Label htmlFor="secure">Use SSL/TLS</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={smtpForm.username}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, username: e.target.value }))}
                              placeholder="your-email@gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={smtpForm.password}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="App password"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fromEmail">From Email</Label>
                            <Input
                              id="fromEmail"
                              value={smtpForm.fromEmail}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                              placeholder="noreply@tanuki.dev"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fromName">From Name</Label>
                            <Input
                              id="fromName"
                              value={smtpForm.fromName}
                              onChange={(e) => setSMTPForm(prev => ({ ...prev, fromName: e.target.value }))}
                              placeholder="Tanuki Storage"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowSMTPDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSMTPSave}>
                          Save Configuration
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {smtpConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Host</p>
                      <p className="font-medium">{smtpConfig.host}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Port</p>
                      <p className="font-medium">{smtpConfig.port}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Security</p>
                      <p className="font-medium">{smtpConfig.secure ? 'SSL/TLS' : 'None'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">{smtpConfig.fromEmail}</p>
                    </div>
                  </div>
                  
                  {testResult && (
                    <Alert variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {testResult.success 
                          ? "SMTP connection successful!" 
                          : `Connection failed: ${testResult.error}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No SMTP Configuration</h3>
                  <p className="text-muted-foreground mb-4">
                    Cấu hình SMTP để bắt đầu gửi email notifications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Edit Template' : 'Create Template'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Server Alert Template"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="🚨 Alert: {{serverName}} requires attention"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="htmlBody">HTML Body</Label>
                      <Textarea
                        id="htmlBody"
                        value={templateForm.htmlBody}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlBody: e.target.value }))}
                        placeholder="<h2>Alert</h2><p>Server {{serverName}} needs attention...</p>"
                        rows={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textBody">Text Body</Label>
                      <Textarea
                        id="textBody"
                        value={templateForm.textBody}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, textBody: e.target.value }))}
                        placeholder="Server {{serverName}} needs attention..."
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate}>
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notification Rules */}
        <TabsContent value="rules">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notification Rules</h3>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? 'Edit Rule' : 'Create Rule'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="ruleName">Rule Name</Label>
                      <Input
                        id="ruleName"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Server Offline Alert"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="event">Event Type</Label>
                      <Select 
                        value={ruleForm.event} 
                        onValueChange={(value) => setRuleForm(prev => ({ ...prev, event: value as NotificationEvent }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server_offline">Server Offline</SelectItem>
                          <SelectItem value="server_online">Server Online</SelectItem>
                          <SelectItem value="disk_full">Disk Full</SelectItem>
                          <SelectItem value="high_cpu">High CPU</SelectItem>
                          <SelectItem value="high_memory">High Memory</SelectItem>
                          <SelectItem value="user_registered">User Registered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                      <Input
                        id="recipients"
                        value={ruleForm.recipients}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, recipients: e.target.value }))}
                        placeholder="admin@tanuki.dev, ops@tanuki.dev"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template">Email Template</Label>
                      <Select 
                        value={ruleForm.templateId} 
                        onValueChange={(value) => setRuleForm(prev => ({ ...prev, templateId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={ruleForm.enabled}
                        onCheckedChange={(checked) => setRuleForm(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enable this rule</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveRule}>
                      {editingRule ? 'Update' : 'Create'} Rule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Event: {rule.event} → Recipients: {rule.recipients.join(', ')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Email Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Email Queue
                </CardTitle>
                <Button variant="outline" onClick={() => setEmailQueue(smtpService.getEmailQueue())}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Danh sách email đã gửi và đang chờ gửi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailQueue.length > 0 ? (
                <div className="space-y-4">
                  {emailQueue.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {email.to.join(', ')}
                        </p>
                        {email.sentAt && (
                          <p className="text-xs text-muted-foreground">
                            Sent: {new Date(email.sentAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          email.status === 'sent' ? 'default' : 
                          email.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {email.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {email.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {email.status === 'pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {email.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Emails in Queue</h3>
                  <p className="text-muted-foreground">
                    Email sẽ xuất hiện ở đây khi được gửi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
