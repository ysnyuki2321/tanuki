export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
  variables: string[]
}

export interface NotificationRule {
  id: string
  name: string
  event: NotificationEvent
  recipients: string[]
  templateId: string
  enabled: boolean
  conditions: NotificationCondition[]
}

export type NotificationEvent = 
  | 'server_offline'
  | 'server_online'
  | 'disk_full'
  | 'disk_low_space'
  | 'high_cpu'
  | 'high_memory'
  | 'ssh_connection_failed'
  | 'user_registered'
  | 'file_uploaded'
  | 'system_error'

export interface NotificationCondition {
  field: string
  operator: 'gt' | 'lt' | 'eq' | 'contains'
  value: string | number
}

export interface EmailNotification {
  id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlBody: string
  textBody: string
  status: 'pending' | 'sent' | 'failed'
  sentAt?: string
  error?: string
  retryCount: number
}

// Mock SMTP service
export class SMTPService {
  private static instance: SMTPService
  private config: SMTPConfig | null = null
  private emailQueue: EmailNotification[] = []

  static getInstance(): SMTPService {
    if (!SMTPService.instance) {
      SMTPService.instance = new SMTPService()
    }
    return SMTPService.instance
  }

  configure(config: SMTPConfig): boolean {
    // Validate SMTP configuration
    if (!config.host || !config.username || !config.password) {
      return false
    }
    
    this.config = config
    console.log(`[v0] SMTP configured: ${config.host}:${config.port}`)
    return true
  }

  getConfig(): SMTPConfig | null {
    return this.config
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: "SMTP not configured" }
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 85% success rate for demo
    const success = Math.random() > 0.15
    
    if (success) {
      return { success: true }
    } else {
      return { 
        success: false, 
        error: "Connection failed: Invalid credentials or server unreachable" 
      }
    }
  }

  async sendEmail(notification: Omit<EmailNotification, 'id' | 'status' | 'retryCount'>): Promise<boolean> {
    if (!this.config) {
      console.error("[v0] SMTP not configured")
      return false
    }

    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const emailNotification: EmailNotification = {
      ...notification,
      id: emailId,
      status: 'pending',
      retryCount: 0
    }

    this.emailQueue.push(emailNotification)

    // Simulate email sending
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 90% success rate
      const success = Math.random() > 0.1
      
      if (success) {
        emailNotification.status = 'sent'
        emailNotification.sentAt = new Date().toISOString()
        console.log(`[v0] Email sent to ${notification.to.join(', ')}: ${notification.subject}`)
        return true
      } else {
        emailNotification.status = 'failed'
        emailNotification.error = 'SMTP server error'
        console.error(`[v0] Failed to send email: ${notification.subject}`)
        return false
      }
    } catch (error) {
      emailNotification.status = 'failed'
      emailNotification.error = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  getEmailQueue(): EmailNotification[] {
    return [...this.emailQueue]
  }

  clearEmailQueue(): void {
    this.emailQueue = []
  }
}

// Notification service for managing rules and templates
export class NotificationService {
  private static instance: NotificationService
  private templates: EmailTemplate[] = []
  private rules: NotificationRule[] = []

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
      NotificationService.instance.initializeDefaultTemplates()
      NotificationService.instance.initializeDefaultRules()
    }
    return NotificationService.instance
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'server-offline',
        name: 'Server Offline Alert',
        subject: '🚨 Server {{serverName}} is Offline',
        htmlBody: `
          <h2>Server Alert</h2>
          <p>Server <strong>{{serverName}}</strong> ({{serverHost}}) has gone offline.</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p><strong>Last seen:</strong> {{lastPing}}</p>
          <p>Please check the server immediately.</p>
        `,
        textBody: 'Server {{serverName}} ({{serverHost}}) is offline. Time: {{timestamp}}',
        variables: ['serverName', 'serverHost', 'timestamp', 'lastPing']
      },
      {
        id: 'disk-full',
        name: 'Disk Full Warning',
        subject: '⚠️ Disk Space Warning on {{serverName}}',
        htmlBody: `
          <h2>Disk Space Alert</h2>
          <p>Server <strong>{{serverName}}</strong> is running low on disk space.</p>
          <p><strong>Disk usage:</strong> {{diskUsage}}%</p>
          <p><strong>Available space:</strong> {{availableSpace}}</p>
          <p>Please free up space or add more storage.</p>
        `,
        textBody: 'Disk space warning on {{serverName}}: {{diskUsage}}% used, {{availableSpace}} remaining',
        variables: ['serverName', 'diskUsage', 'availableSpace']
      },
      {
        id: 'user-registered',
        name: 'New User Registration',
        subject: '👋 Welcome to Tanuki Storage Platform',
        htmlBody: `
          <h2>Welcome to Tanuki!</h2>
          <p>Hi <strong>{{userName}}</strong>,</p>
          <p>Your account has been successfully created.</p>
          <p><strong>Email:</strong> {{userEmail}}</p>
          <p><strong>Storage limit:</strong> {{storageLimit}}</p>
          <p>You can now start uploading and managing your files.</p>
        `,
        textBody: 'Welcome {{userName}}! Your Tanuki account has been created. Storage limit: {{storageLimit}}',
        variables: ['userName', 'userEmail', 'storageLimit']
      }
    ]
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-1',
        name: 'Server Offline Alert',
        event: 'server_offline',
        recipients: ['admin@tanuki.dev'],
        templateId: 'server-offline',
        enabled: true,
        conditions: []
      },
      {
        id: 'rule-2', 
        name: 'Disk Space Warning',
        event: 'disk_full',
        recipients: ['admin@tanuki.dev', 'ops@tanuki.dev'],
        templateId: 'disk-full',
        enabled: true,
        conditions: [
          { field: 'diskUsage', operator: 'gt', value: 85 }
        ]
      },
      {
        id: 'rule-3',
        name: 'Welcome New Users',
        event: 'user_registered',
        recipients: ['{{userEmail}}'],
        templateId: 'user-registered',
        enabled: true,
        conditions: []
      }
    ]
  }

  getTemplates(): EmailTemplate[] {
    return [...this.templates]
  }

  getRules(): NotificationRule[] {
    return [...this.rules]
  }

  addTemplate(template: Omit<EmailTemplate, 'id'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`
    }
    this.templates.push(newTemplate)
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<EmailTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === id)
    if (index >= 0) {
      this.templates[index] = { ...this.templates[index], ...updates }
      return true
    }
    return false
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id)
    if (index >= 0) {
      this.templates.splice(index, 1)
      return true
    }
    return false
  }

  addRule(rule: Omit<NotificationRule, 'id'>): NotificationRule {
    const newRule: NotificationRule = {
      ...rule,
      id: `rule-${Date.now()}`
    }
    this.rules.push(newRule)
    return newRule
  }

  updateRule(id: string, updates: Partial<NotificationRule>): boolean {
    const index = this.rules.findIndex(r => r.id === id)
    if (index >= 0) {
      this.rules[index] = { ...this.rules[index], ...updates }
      return true
    }
    return false
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id)
    if (index >= 0) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  async sendNotification(
    event: NotificationEvent, 
    data: Record<string, any>
  ): Promise<void> {
    const relevantRules = this.rules.filter(rule => 
      rule.enabled && 
      rule.event === event &&
      this.checkConditions(rule.conditions, data)
    )

    for (const rule of relevantRules) {
      const template = this.templates.find(t => t.id === rule.templateId)
      if (!template) continue

      const recipients = rule.recipients.map(email => 
        this.replaceVariables(email, data)
      )

      const subject = this.replaceVariables(template.subject, data)
      const htmlBody = this.replaceVariables(template.htmlBody, data)
      const textBody = this.replaceVariables(template.textBody, data)

      await SMTPService.getInstance().sendEmail({
        to: recipients,
        subject,
        htmlBody,
        textBody
      })
    }
  }

  private checkConditions(conditions: NotificationCondition[], data: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = data[condition.field]
      const targetValue = condition.value

      switch (condition.operator) {
        case 'gt':
          return Number(value) > Number(targetValue)
        case 'lt':
          return Number(value) < Number(targetValue)
        case 'eq':
          return value === targetValue
        case 'contains':
          return String(value).includes(String(targetValue))
        default:
          return false
      }
    })
  }

  private replaceVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }
}
