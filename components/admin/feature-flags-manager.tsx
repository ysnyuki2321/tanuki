"use client";

import React, { useState, useEffect } from 'react';
import { 
  featureFlagsService, 
  FeatureFlag, 
  CreateFeatureFlagRequest, 
  UpdateFeatureFlagRequest,
  FeatureFlagStats 
} from '@/lib/feature-flags-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Copy, 
  Trash2, 
  Power, 
  PowerOff,
  Settings,
  Activity,
  Flag,
  Users,
  Globe
} from 'lucide-react';

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [stats, setStats] = useState<FeatureFlagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deleteFlag, setDeleteFlag] = useState<FeatureFlag | null>(null);
  const [duplicateFlag, setDuplicateFlag] = useState<FeatureFlag | null>(null);
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | 'delete' | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateFeatureFlagRequest>({
    key: '',
    name: '',
    description: '',
    is_enabled: false,
    tenant_id: '',
    target_percentage: 100,
    dependencies: [],
    metadata: {},
  });

  const [duplicateFormData, setDuplicateFormData] = useState({
    key: '',
    name: '',
  });

  useEffect(() => {
    loadFlags();
    loadStats();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await featureFlagsService.getFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Error loading flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await featureFlagsService.getFeatureFlagStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateFlag = async () => {
    try {
      if (!formData.key || !formData.name) {
        toast.error('Please fill in required fields');
        return;
      }

      await featureFlagsService.createFeatureFlag(formData);
      toast.success('Feature flag created successfully');
      setShowCreateModal(false);
      resetForm();
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error creating flag:', error);
      toast.error('Failed to create feature flag');
    }
  };

  const handleUpdateFlag = async () => {
    try {
      if (!editingFlag || !formData.key || !formData.name) {
        toast.error('Please fill in required fields');
        return;
      }

      await featureFlagsService.updateFeatureFlag({
        id: editingFlag.id,
        ...formData,
      });
      toast.success('Feature flag updated successfully');
      setEditingFlag(null);
      resetForm();
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error updating flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    try {
      await featureFlagsService.deleteFeatureFlag(flag.id);
      toast.success('Feature flag deleted successfully');
      setDeleteFlag(null);
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error deleting flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      await featureFlagsService.toggleFeatureFlag(flag.id, !flag.is_enabled);
      toast.success(`Feature flag ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Failed to toggle feature flag');
    }
  };

  const handleDuplicateFlag = async () => {
    try {
      if (!duplicateFlag || !duplicateFormData.key || !duplicateFormData.name) {
        toast.error('Please fill in required fields');
        return;
      }

      await featureFlagsService.duplicateFeatureFlag(
        duplicateFlag.id,
        duplicateFormData.key,
        duplicateFormData.name
      );
      toast.success('Feature flag duplicated successfully');
      setDuplicateFlag(null);
      setDuplicateFormData({ key: '', name: '' });
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error duplicating flag:', error);
      toast.error('Failed to duplicate feature flag');
    }
  };

  const handleBulkAction = async () => {
    try {
      if (!bulkAction || selectedFlags.length === 0) return;

      if (bulkAction === 'delete') {
        for (const flagId of selectedFlags) {
          await featureFlagsService.deleteFeatureFlag(flagId);
        }
        toast.success(`${selectedFlags.length} feature flags deleted`);
      } else {
        const enabled = bulkAction === 'enable';
        await featureFlagsService.bulkToggleFeatureFlags(selectedFlags, enabled);
        toast.success(`${selectedFlags.length} feature flags ${enabled ? 'enabled' : 'disabled'}`);
      }

      setSelectedFlags([]);
      setBulkAction(null);
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      is_enabled: false,
      tenant_id: '',
      target_percentage: 100,
      dependencies: [],
      metadata: {},
    });
  };

  const openEditModal = (flag: FeatureFlag) => {
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      is_enabled: flag.is_enabled,
      tenant_id: flag.tenant_id || '',
      target_percentage: flag.target_percentage,
      dependencies: flag.dependencies || [],
      metadata: flag.metadata || {},
    });
    setEditingFlag(flag);
  };

  const filteredFlags = flags.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFlags(filteredFlags.map(flag => flag.id));
    } else {
      setSelectedFlags([]);
    }
  };

  const handleSelectFlag = (flagId: string, checked: boolean) => {
    if (checked) {
      setSelectedFlags([...selectedFlags, flagId]);
    } else {
      setSelectedFlags(selectedFlags.filter(id => id !== flagId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Flags</p>
                  <p className="text-2xl font-bold">{stats.total_flags}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Power className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Enabled</p>
                  <p className="text-2xl font-bold">{stats.enabled_flags}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PowerOff className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Disabled</p>
                  <p className="text-2xl font-bold">{stats.disabled_flags}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Tenant Specific</p>
                  <p className="text-2xl font-bold">{stats.tenant_specific_flags}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Global</p>
                  <p className="text-2xl font-bold">{stats.global_flags}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search feature flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedFlags.length > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              <Badge variant="secondary">{selectedFlags.length} selected</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkAction('enable')}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkAction('disable')}
              >
                Disable All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkAction('delete')}
              >
                Delete All
              </Button>
            </div>
          )}

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">Key *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="feature_key"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Feature Name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this feature flag controls..."
                  />
                </div>
                <div>
                  <Label htmlFor="tenant_id">Tenant ID (optional)</Label>
                  <Input
                    id="tenant_id"
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    placeholder="Leave empty for global flag"
                  />
                </div>
                <div>
                  <Label htmlFor="target_percentage">Target Percentage</Label>
                  <Input
                    id="target_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.target_percentage}
                    onChange={(e) => setFormData({ ...formData, target_percentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  />
                  <Label htmlFor="is_enabled">Start enabled</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFlag}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Feature Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFlags.length === filteredFlags.length && filteredFlags.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Target %</TableHead>
                <TableHead>Dependencies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No feature flags found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFlags.includes(flag.id)}
                        onCheckedChange={(checked) => handleSelectFlag(flag.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{flag.name}</p>
                        <p className="text-sm text-gray-500">{flag.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{flag.key}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={flag.is_enabled}
                          onCheckedChange={() => handleToggleFlag(flag)}
                        />
                        <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                          {flag.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={flag.tenant_id ? 'outline' : 'secondary'}>
                        {flag.tenant_id ? `Tenant: ${flag.tenant_id}` : 'Global'}
                      </Badge>
                    </TableCell>
                    <TableCell>{flag.target_percentage}%</TableCell>
                    <TableCell>
                      {flag.dependencies && flag.dependencies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {flag.dependencies.map((dep, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(flag.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(flag)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDuplicateFlag(flag)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteFlag(flag)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingFlag} onOpenChange={(open) => !open && setEditingFlag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-key">Key *</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="feature_key"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Feature Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this feature flag controls..."
              />
            </div>
            <div>
              <Label htmlFor="edit-tenant_id">Tenant ID (optional)</Label>
              <Input
                id="edit-tenant_id"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                placeholder="Leave empty for global flag"
              />
            </div>
            <div>
              <Label htmlFor="edit-target_percentage">Target Percentage</Label>
              <Input
                id="edit-target_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.target_percentage}
                onChange={(e) => setFormData({ ...formData, target_percentage: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_enabled"
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
              <Label htmlFor="edit-is_enabled">Enabled</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingFlag(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFlag}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog open={!!duplicateFlag} onOpenChange={(open) => !open && setDuplicateFlag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duplicate-key">New Key *</Label>
              <Input
                id="duplicate-key"
                value={duplicateFormData.key}
                onChange={(e) => setDuplicateFormData({ ...duplicateFormData, key: e.target.value })}
                placeholder="new_feature_key"
              />
            </div>
            <div>
              <Label htmlFor="duplicate-name">New Name *</Label>
              <Input
                id="duplicate-name"
                value={duplicateFormData.name}
                onChange={(e) => setDuplicateFormData({ ...duplicateFormData, name: e.target.value })}
                placeholder="New Feature Name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDuplicateFlag(null)}>
                Cancel
              </Button>
              <Button onClick={handleDuplicateFlag}>Duplicate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFlag} onOpenChange={(open) => !open && setDeleteFlag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFlag?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFlag && handleDeleteFlag(deleteFlag)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Action Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedFlags.length} feature flag{selectedFlags.length !== 1 ? 's' : ''}?
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {bulkAction === 'enable' ? 'Enable' : bulkAction === 'disable' ? 'Disable' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
