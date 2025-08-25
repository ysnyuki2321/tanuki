'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Database, Mail, Cloud, CreditCard, Shield, Settings } from 'lucide-react';

interface SetupConfig {
  // Database
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_key: string;
  
  // Email
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  
  // Storage
  storage_provider: string;
  aws_access_key: string;
  aws_secret_key: string;
  aws_bucket: string;
  aws_region: string;
  
  // Payment
  stripe_public_key: string;
  stripe_secret_key: string;
  paypal_client_id: string;
  paypal_client_secret: string;
  
  // Security
  jwt_secret: string;
  encryption_key: string;
  
  // Features
  enable_registration: boolean;
  enable_email_verification: boolean;
  enable_file_sharing: boolean;
  enable_collaboration: boolean;
  enable_virus_scan: boolean;
  enable_compression: boolean;
  
  // Limits
  default_storage_quota: string;
  default_file_limit: string;
  max_file_size: string;
}

export default function SetupWizard() {
  const [config, setConfig] = useState<SetupConfig>({
    // Default all to empty strings (null-safe)
    supabase_url: '',
    supabase_anon_key: '',
    supabase_service_key: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
    storage_provider: 'supabase',
    aws_access_key: '',
    aws_secret_key: '',
    aws_bucket: '',
    aws_region: 'us-east-1',
    stripe_public_key: '',
    stripe_secret_key: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    jwt_secret: '',
    encryption_key: '',
    enable_registration: true,
    enable_email_verification: true,
    enable_file_sharing: true,
    enable_collaboration: true,
    enable_virus_scan: false,
    enable_compression: true,
    default_storage_quota: '1073741824', // 1GB
    default_file_limit: '1000',
    max_file_size: '104857600', // 100MB
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [setupStatus, setSetupStatus] = useState({
    database_connected: false,
    email_configured: false,
    storage_configured: false,
    payment_configured: false,
    security_configured: false,
    is_ready: false,
  });

  // Load current config from API
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
        updateSetupStatus(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const updateSetupStatus = (configData: Partial<SetupConfig>) => {
    setSetupStatus({
      database_connected: !!(configData.supabase_url && configData.supabase_anon_key),
      email_configured: !!(configData.smtp_host && configData.smtp_user),
      storage_configured: !!(configData.storage_provider),
      payment_configured: !!(configData.stripe_public_key || configData.paypal_client_id),
      security_configured: !!(configData.jwt_secret && configData.encryption_key),
      is_ready: false, // Will be calculated
    });
  };

  const handleInputChange = (key: keyof SetupConfig, value: string | boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateSetupStatus(newConfig);
  };

  const generateSecureKey = (length: number = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateKeys = () => {
    setConfig(prev => ({
      ...prev,
      jwt_secret: generateSecureKey(64),
      encryption_key: generateSecureKey(32),
    }));
  };

  const testConnection = async (type: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`${type} connection successful!`);
      } else {
        alert(`${type} connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error testing ${type} connection`);
    }
    setSaving(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    setErrors([]);
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Configuration saved successfully!');
        loadCurrentConfig();
      } else {
        setErrors(result.errors || ['Failed to save configuration']);
      }
    } catch (error) {
      setErrors(['Error saving configuration']);
    }
    
    setSaving(false);
  };

  const StatusIcon = ({ connected }: { connected: boolean }) => (
    connected ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
  );

  return (
    <div className="space-y-6">
      {/* Setup Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Setup Status
          </CardTitle>
          <CardDescription>
            Configure your Tanuki platform step by step. All required fields can be left empty initially and configured later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon connected={setupStatus.database_connected} />
              <span className="text-sm">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon connected={setupStatus.email_configured} />
              <span className="text-sm">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon connected={setupStatus.storage_configured} />
              <span className="text-sm">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon connected={setupStatus.payment_configured} />
              <span className="text-sm">Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon connected={setupStatus.security_configured} />
              <span className="text-sm">Security</span>
            </div>
          </div>
          
          {setupStatus.is_ready ? (
            <Badge variant="default" className="mt-4">System Ready</Badge>
          ) : (
            <Badge variant="secondary" className="mt-4">Setup in Progress</Badge>
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="database" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-1">
            <Cloud className="w-4 h-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Database Configuration */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Connect to Supabase for data storage and authentication. Leave empty to configure later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase_url">Supabase URL</Label>
                <Input
                  id="supabase_url"
                  value={config.supabase_url}
                  onChange={(e) => handleInputChange('supabase_url', e.target.value)}
                  placeholder="https://your-project.supabase.co (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supabase_anon_key">Supabase Anon Key</Label>
                <Input
                  id="supabase_anon_key"
                  value={config.supabase_anon_key}
                  onChange={(e) => handleInputChange('supabase_anon_key', e.target.value)}
                  placeholder="Your anon key (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supabase_service_key">Supabase Service Key</Label>
                <Input
                  id="supabase_service_key"
                  type="password"
                  value={config.supabase_service_key}
                  onChange={(e) => handleInputChange('supabase_service_key', e.target.value)}
                  placeholder="Your service role key (optional)"
                />
              </div>
              
              <Button 
                onClick={() => testConnection('database')} 
                disabled={saving || !config.supabase_url}
                variant="outline"
              >
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP for email verification and notifications. Can be setup later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={config.smtp_host}
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    value={config.smtp_port}
                    onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_user">SMTP Username</Label>
                <Input
                  id="smtp_user"
                  value={config.smtp_user}
                  onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                  placeholder="your-email@example.com (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_pass">SMTP Password</Label>
                <Input
                  id="smtp_pass"
                  type="password"
                  value={config.smtp_pass}
                  onChange={(e) => handleInputChange('smtp_pass', e.target.value)}
                  placeholder="Your password or app password (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    value={config.from_email}
                    onChange={(e) => handleInputChange('from_email', e.target.value)}
                    placeholder="noreply@yourdomain.com (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={config.from_name}
                    onChange={(e) => handleInputChange('from_name', e.target.value)}
                    placeholder="Your App Name (optional)"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => testConnection('email')} 
                disabled={saving || !config.smtp_host}
                variant="outline"
              >
                Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Configuration */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure security keys. Auto-generate secure keys or provide your own.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jwt_secret">JWT Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="jwt_secret"
                    type="password"
                    value={config.jwt_secret}
                    onChange={(e) => handleInputChange('jwt_secret', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                  <Button 
                    onClick={handleGenerateKeys}
                    variant="outline"
                    type="button"
                  >
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="encryption_key">Encryption Key</Label>
                <Input
                  id="encryption_key"
                  type="password"
                  value={config.encryption_key}
                  onChange={(e) => handleInputChange('encryption_key', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Configuration */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>
                Enable or disable features. All can be changed later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_registration">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register</p>
                  </div>
                  <Switch
                    id="enable_registration"
                    checked={config.enable_registration}
                    onCheckedChange={(checked) => handleInputChange('enable_registration', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_email_verification">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    id="enable_email_verification"
                    checked={config.enable_email_verification}
                    onCheckedChange={(checked) => handleInputChange('enable_email_verification', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_file_sharing">File Sharing</Label>
                    <p className="text-sm text-muted-foreground">Allow users to share files publicly</p>
                  </div>
                  <Switch
                    id="enable_file_sharing"
                    checked={config.enable_file_sharing}
                    onCheckedChange={(checked) => handleInputChange('enable_file_sharing', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_collaboration">Real-time Collaboration</Label>
                    <p className="text-sm text-muted-foreground">Enable collaborative editing features</p>
                  </div>
                  <Switch
                    id="enable_collaboration"
                    checked={config.enable_collaboration}
                    onCheckedChange={(checked) => handleInputChange('enable_collaboration', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_virus_scan">Virus Scanning</Label>
                    <p className="text-sm text-muted-foreground">Scan uploaded files for malware</p>
                  </div>
                  <Switch
                    id="enable_virus_scan"
                    checked={config.enable_virus_scan}
                    onCheckedChange={(checked) => handleInputChange('enable_virus_scan', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_compression">File Compression</Label>
                    <p className="text-sm text-muted-foreground">Automatically compress files to save storage</p>
                  </div>
                  <Switch
                    id="enable_compression"
                    checked={config.enable_compression}
                    onCheckedChange={(checked) => handleInputChange('enable_compression', checked)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="default_storage_quota">Default Storage Quota (bytes)</Label>
                  <Input
                    id="default_storage_quota"
                    value={config.default_storage_quota}
                    onChange={(e) => handleInputChange('default_storage_quota', e.target.value)}
                    placeholder="1073741824 (1GB)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_file_limit">Default File Limit</Label>
                  <Input
                    id="default_file_limit"
                    value={config.default_file_limit}
                    onChange={(e) => handleInputChange('default_file_limit', e.target.value)}
                    placeholder="1000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_file_size">Max File Size (bytes)</Label>
                  <Input
                    id="max_file_size"
                    value={config.max_file_size}
                    onChange={(e) => handleInputChange('max_file_size', e.target.value)}
                    placeholder="104857600 (100MB)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Storage Configuration */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>
                Configure file storage provider. Defaults to Supabase, can add AWS S3 later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storage_provider">Storage Provider</Label>
                <select
                  id="storage_provider"
                  value={config.storage_provider}
                  onChange={(e) => handleInputChange('storage_provider', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="supabase">Supabase Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                </select>
              </div>

              {config.storage_provider === 's3' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="aws_access_key">AWS Access Key</Label>
                    <Input
                      id="aws_access_key"
                      value={config.aws_access_key}
                      onChange={(e) => handleInputChange('aws_access_key', e.target.value)}
                      placeholder="AKIA... (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aws_secret_key">AWS Secret Key</Label>
                    <Input
                      id="aws_secret_key"
                      type="password"
                      value={config.aws_secret_key}
                      onChange={(e) => handleInputChange('aws_secret_key', e.target.value)}
                      placeholder="Your secret key (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aws_bucket">S3 Bucket</Label>
                      <Input
                        id="aws_bucket"
                        value={config.aws_bucket}
                        onChange={(e) => handleInputChange('aws_bucket', e.target.value)}
                        placeholder="your-bucket-name (optional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aws_region">AWS Region</Label>
                      <Input
                        id="aws_region"
                        value={config.aws_region}
                        onChange={(e) => handleInputChange('aws_region', e.target.value)}
                        placeholder="us-east-1"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={() => testConnection('storage')}
                disabled={saving}
                variant="outline"
              >
                Test Storage Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Configuration */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
              <CardDescription>
                Configure payment gateways for subscription billing. Optional, can be setup later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Stripe Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="stripe_public_key">Stripe Public Key</Label>
                  <Input
                    id="stripe_public_key"
                    value={config.stripe_public_key}
                    onChange={(e) => handleInputChange('stripe_public_key', e.target.value)}
                    placeholder="pk_test_... (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_secret_key">Stripe Secret Key</Label>
                  <Input
                    id="stripe_secret_key"
                    type="password"
                    value={config.stripe_secret_key}
                    onChange={(e) => handleInputChange('stripe_secret_key', e.target.value)}
                    placeholder="sk_test_... (optional)"
                  />
                </div>

                <Button
                  onClick={() => testConnection('stripe')}
                  disabled={saving || !config.stripe_secret_key}
                  variant="outline"
                >
                  Test Stripe Connection
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">PayPal Configuration</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paypal_client_id">PayPal Client ID</Label>
                    <Input
                      id="paypal_client_id"
                      value={config.paypal_client_id}
                      onChange={(e) => handleInputChange('paypal_client_id', e.target.value)}
                      placeholder="Your PayPal client ID (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paypal_client_secret">PayPal Client Secret</Label>
                    <Input
                      id="paypal_client_secret"
                      type="password"
                      value={config.paypal_client_secret}
                      onChange={(e) => handleInputChange('paypal_client_secret', e.target.value)}
                      placeholder="Your PayPal client secret (optional)"
                    />
                  </div>

                  <Button
                    onClick={() => testConnection('paypal')}
                    disabled={saving || !config.paypal_client_id}
                    variant="outline"
                  >
                    Test PayPal Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving} className="min-w-32">
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
