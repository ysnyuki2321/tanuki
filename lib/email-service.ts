import { AdminConfigService } from './admin-config'

export interface EmailConfig {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_secure: boolean
  email_from_address: string
  email_from_name: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private static config: EmailConfig | null = null

  // Load email configuration from admin config
  static async loadConfig(): Promise<EmailConfig | null> {
    try {
      const configs = await AdminConfigService.getConfigValues('email')
      
      if (!configs.smtp_host || !configs.smtp_user) {
        return null
      }

      this.config = {
        smtp_host: configs.smtp_host,
        smtp_port: configs.smtp_port || 587,
        smtp_user: configs.smtp_user,
        smtp_password: configs.smtp_password,
        smtp_secure: configs.smtp_secure !== false,
        email_from_address: configs.email_from_address || 'noreply@tanuki.dev',
        email_from_name: configs.email_from_name || 'Tanuki Storage'
      }

      return this.config
    } catch (error) {
      console.error('Failed to load email config:', error)
      return null
    }
  }

  // Test email configuration
  static async testConnection(config?: EmailConfig): Promise<{ success: boolean; error?: string }> {
    const emailConfig = config || this.config || await this.loadConfig()
    
    if (!emailConfig) {
      return { success: false, error: 'Email configuration not found' }
    }

    try {
      // In a real implementation, you would use nodemailer or similar
      // For now, we'll simulate a connection test
      if (!emailConfig.smtp_host || !emailConfig.smtp_user) {
        return { success: false, error: 'Missing required SMTP configuration' }
      }

      // Simulate connection test delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'SMTP connection failed' 
      }
    }
  }

  // Send email
  static async sendEmail(
    to: string | string[],
    template: EmailTemplate,
    variables: Record<string, string> = {}
  ): Promise<{ success: boolean; error?: string }> {
    const config = this.config || await this.loadConfig()
    
    if (!config) {
      return { success: false, error: 'Email service not configured' }
    }

    try {
      // Replace template variables
      let { subject, html, text } = template
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
        html = html.replace(new RegExp(placeholder, 'g'), value)
        text = text.replace(new RegExp(placeholder, 'g'), value)
      })

      // In a real implementation, you would use nodemailer or similar
      // For now, we'll simulate email sending
      console.log('Sending email:', {
        from: `${config.email_from_name} <${config.email_from_address}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html.substring(0, 100) + '...',
        text: text.substring(0, 100) + '...'
      })

      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return { success: true }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  // Generate email verification template
  static generateEmailVerificationTemplate(
    userEmail: string,
    verificationUrl: string,
    userName?: string
  ): EmailTemplate {
    const displayName = userName || userEmail.split('@')[0]
    
    return {
      subject: 'Verify your email address - Tanuki Storage',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 20px; }
            .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
            .message { font-size: 16px; line-height: 1.6; color: #6b7280; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .logo { width: 40px; height: 40px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦝 Tanuki Storage</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello {{userName}},</div>
              <div class="message">
                Thank you for signing up for Tanuki Storage! To complete your registration and start using our platform, please verify your email address by clicking the button below.
              </div>
              <div style="text-align: center;">
                <a href="{{verificationUrl}}" class="cta-button">Verify Email Address</a>
              </div>
              <div class="message">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="{{verificationUrl}}" style="color: #6366f1; word-break: break-all;">{{verificationUrl}}</a>
              </div>
              <div class="message">
                This verification link will expire in 24 hours for security reasons.
              </div>
              <div class="message">
                If you didn't create an account with us, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>© 2024 Tanuki Storage. All rights reserved.</p>
              <p>Smart Web Storage Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${displayName},

Thank you for signing up for Tanuki Storage!

To complete your registration, please verify your email address by visiting:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

---
Tanuki Storage Team
Smart Web Storage Platform
      `.trim()
    }
  }

  // Generate password reset template
  static generatePasswordResetTemplate(
    userEmail: string,
    resetUrl: string,
    userName?: string
  ): EmailTemplate {
    const displayName = userName || userEmail.split('@')[0]
    
    return {
      subject: 'Reset your password - Tanuki Storage',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 20px; }
            .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
            .message { font-size: 16px; line-height: 1.6; color: #6b7280; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦝 Tanuki Storage</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello {{userName}},</div>
              <div class="message">
                We received a request to reset the password for your Tanuki Storage account. If you made this request, click the button below to set a new password.
              </div>
              <div style="text-align: center;">
                <a href="{{resetUrl}}" class="cta-button">Reset Password</a>
              </div>
              <div class="message">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="{{resetUrl}}" style="color: #ef4444; word-break: break-all;">{{resetUrl}}</a>
              </div>
              <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
              </div>
              <div class="message">
                For your security, please make sure to choose a strong password that you haven't used before.
              </div>
            </div>
            <div class="footer">
              <p>© 2024 Tanuki Storage. All rights reserved.</p>
              <p>Smart Web Storage Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${displayName},

We received a request to reset the password for your Tanuki Storage account.

To reset your password, visit:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

---
Tanuki Storage Team
Smart Web Storage Platform
      `.trim()
    }
  }

  // Generate welcome email template
  static generateWelcomeTemplate(
    userEmail: string,
    userName?: string
  ): EmailTemplate {
    const displayName = userName || userEmail.split('@')[0]
    
    return {
      subject: 'Welcome to Tanuki Storage!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Tanuki Storage</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 20px; }
            .greeting { font-size: 18px; margin-bottom: 20px; color: #374151; }
            .message { font-size: 16px; line-height: 1.6; color: #6b7280; margin-bottom: 30px; }
            .features { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 10px 0; display: flex; align-items: center; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦝 Welcome to Tanuki Storage!</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello {{userName}},</div>
              <div class="message">
                Congratulations! Your Tanuki Storage account has been successfully created and verified. You're now ready to experience the smartest web storage platform.
              </div>
              <div class="features">
                <h3 style="margin-top: 0; color: #065f46;">What you can do with Tanuki Storage:</h3>
                <div class="feature-item">✨ Upload and organize files with intelligent categorization</div>
                <div class="feature-item">🔄 Track file versions and restore previous versions</div>
                <div class="feature-item">🔗 Share files securely with customizable permissions</div>
                <div class="feature-item">🔍 Search your files with powerful full-text search</div>
                <div class="feature-item">🤝 Collaborate with team members in real-time</div>
                <div class="feature-item">📊 Monitor usage and analytics</div>
              </div>
              <div style="text-align: center;">
                <a href="{{dashboardUrl}}" class="cta-button">Start Using Tanuki Storage</a>
              </div>
              <div class="message">
                If you have any questions or need help getting started, don't hesitate to reach out to our support team.
              </div>
            </div>
            <div class="footer">
              <p>© 2024 Tanuki Storage. All rights reserved.</p>
              <p>Smart Web Storage Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Tanuki Storage!

Hello ${displayName},

Congratulations! Your account has been successfully created and verified.

What you can do with Tanuki Storage:
- Upload and organize files with intelligent categorization
- Track file versions and restore previous versions  
- Share files securely with customizable permissions
- Search your files with powerful full-text search
- Collaborate with team members in real-time
- Monitor usage and analytics

Start using Tanuki Storage: {{dashboardUrl}}

If you have any questions, feel free to contact our support team.

---
Tanuki Storage Team
Smart Web Storage Platform
      `.trim()
    }
  }

  // Send email verification
  static async sendEmailVerification(userEmail: string, verificationUrl: string, userName?: string) {
    const template = this.generateEmailVerificationTemplate(userEmail, verificationUrl, userName)
    
    return await this.sendEmail(userEmail, template, {
      userName: userName || userEmail.split('@')[0],
      verificationUrl
    })
  }

  // Send password reset email
  static async sendPasswordReset(userEmail: string, resetUrl: string, userName?: string) {
    const template = this.generatePasswordResetTemplate(userEmail, resetUrl, userName)
    
    return await this.sendEmail(userEmail, template, {
      userName: userName || userEmail.split('@')[0],
      resetUrl
    })
  }

  // Send welcome email
  static async sendWelcomeEmail(userEmail: string, userName?: string, dashboardUrl?: string) {
    const template = this.generateWelcomeTemplate(userEmail, userName)
    
    return await this.sendEmail(userEmail, template, {
      userName: userName || userEmail.split('@')[0],
      dashboardUrl: dashboardUrl || 'https://tanuki.dev/dashboard'
    })
  }
}

export default EmailService
