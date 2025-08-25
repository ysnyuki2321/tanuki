'use client';

import { useState } from 'react';
import { FileStorageService } from '@/lib/file-storage';
import { type DbFile } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Share2, 
  Copy, 
  Mail, 
  Clock, 
  Shield, 
  Eye, 
  Download, 
  Edit3,
  Link2,
  Calendar,
  Lock,
  Users,
  Globe,
  Loader2,
  Check
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ShareFileModalProps {
  file: DbFile;
  trigger?: React.ReactNode;
  onShared?: (shareToken: string) => void;
}

interface ShareSettings {
  shareType: 'public' | 'email' | 'password';
  emails: string[];
  permissions: string[];
  expiresAt: string | null;
  password: string;
  allowDownload: boolean;
  allowPreview: boolean;
  maxDownloads: number | null;
}

const DEFAULT_SETTINGS: ShareSettings = {
  shareType: 'public',
  emails: [],
  permissions: ['read'],
  expiresAt: null,
  password: '',
  allowDownload: true,
  allowPreview: true,
  maxDownloads: null,
};

const PERMISSION_OPTIONS = [
  { value: 'read', label: 'View', description: 'Can view and preview the file', icon: Eye },
  { value: 'download', label: 'Download', description: 'Can download the file', icon: Download },
  { value: 'edit', label: 'Edit', description: 'Can edit the file (if supported)', icon: Edit3 },
];

const EXPIRY_OPTIONS = [
  { value: '', label: 'Never expires' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1m', label: '1 month' },
  { value: 'custom', label: 'Custom date' },
];

export function ShareFileModal({ file, trigger, onShared }: ShareFileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ShareSettings>(DEFAULT_SETTINGS);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ token: string; url: string } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [copied, setCopied] = useState(false);

  const calculateExpiryDate = (option: string): Date | null => {
    if (!option) return null;
    
    const now = new Date();
    switch (option) {
      case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
      case '1d': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1m': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'custom': return customDate ? new Date(customDate) : null;
      default: return null;
    }
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes('@') && !settings.emails.includes(email)) {
      setSettings(prev => ({
        ...prev,
        emails: [...prev.emails, email]
      }));
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== email)
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setSettings(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const expiryDate = calculateExpiryDate(settings.expiresAt || '');
      
      // Prepare share options
      const shareOptions: any = {
        permissions: settings.permissions,
        expiresAt: expiryDate,
      };

      if (settings.shareType === 'email' && settings.emails.length > 0) {
        // For now, share with first email (could be extended to multiple)
        shareOptions.email = settings.emails[0];
      }

      if (settings.shareType === 'password' && settings.password) {
        shareOptions.password = settings.password;
      }

      if (settings.maxDownloads) {
        shareOptions.maxDownloads = settings.maxDownloads;
      }

      const result = await FileStorageService.shareFile(file.id, shareOptions);

      if (result.success && result.shareToken) {
        const shareUrl = `${window.location.origin}/share/${result.shareToken}`;
        setShareResult({
          token: result.shareToken,
          url: shareUrl
        });
        onShared?.(result.shareToken);
        toast.success('File shared successfully');
      } else {
        toast.error(result.error || 'Failed to share file');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to share file');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareResult?.url) {
      try {
        await navigator.clipboard.writeText(shareResult.url);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setShareResult(null);
    setEmailInput('');
    setCustomDate('');
    setCopied(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{file.original_name}"
          </DialogTitle>
        </DialogHeader>

        {shareResult ? (
          // Share Result
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                File shared successfully! Copy the link below to share with others.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={shareResult.url} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Permissions:</span>
                    <div className="flex gap-1 mt-1">
                      {settings.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {PERMISSION_OPTIONS.find(p => p.value === permission)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>
                    <p className="text-muted-foreground">
                      {settings.expiresAt ? 
                        calculateExpiryDate(settings.expiresAt)?.toLocaleDateString() || 'Custom date' :
                        'Never'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline">
                    Share Again
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Share Configuration
          <Tabs value={settings.shareType} onValueChange={(value) => setSettings(prev => ({ ...prev, shareType: value as ShareSettings['shareType'] }))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Public
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </TabsTrigger>
            </TabsList>

            <div className="space-y-6 mt-6">
              <TabsContent value="public" className="space-y-4">
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Anyone with the link can access this file according to the permissions you set.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label>Email addresses</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                    <Button onClick={handleAddEmail} variant="outline">
                      Add
                    </Button>
                  </div>
                  {settings.emails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {settings.emails.map(email => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <button 
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={settings.password}
                    onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will need this password to access the file
                  </p>
                </div>
              </TabsContent>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {PERMISSION_OPTIONS.map(permission => {
                    const Icon = permission.icon;
                    return (
                      <div key={permission.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{permission.label}</p>
                            <p className="text-sm text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.permissions.includes(permission.value)}
                          onCheckedChange={() => handlePermissionToggle(permission.value)}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Expiry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Expiry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Link expires</Label>
                    <Select 
                      value={settings.expiresAt || ''} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, expiresAt: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPIRY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.expiresAt === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-date">Custom expiry date</Label>
                      <Input
                        id="custom-date"
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="max-downloads">Maximum downloads (optional)</Label>
                    <Input
                      id="max-downloads"
                      type="number"
                      placeholder="Unlimited"
                      value={settings.maxDownloads || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        maxDownloads: e.target.value ? Number(e.target.value) : null 
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleShare} 
                  disabled={isSharing || settings.permissions.length === 0}
                  className="flex items-center gap-2"
                >
                  {isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  {isSharing ? 'Sharing...' : 'Create Share Link'}
                </Button>
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShareFileModal;
