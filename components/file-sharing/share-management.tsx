"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Share2,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Download,
  Eye,
  Users,
  Globe,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { FileSharingService, type ShareStats } from '@/lib/file-sharing-service'
import type { DbShare } from '@/lib/database-schema'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

interface ShareManagementProps {
  userId?: string
}

export function ShareManagement({ userId }: ShareManagementProps) {
  const [shares, setShares] = useState<DbShare[]>([])
  const [stats, setStats] = useState<ShareStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all')
  const [selectedShare, setSelectedShare] = useState<DbShare | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sharesData, statsData] = await Promise.all([
        FileSharingService.getUserShares(userId),
        FileSharingService.getShareStats(userId)
      ])
      setShares(sharesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading share data:', error)
      toast.error('Failed to load share data')
    } finally {
      setLoading(false)
    }
  }

  const getShareStatus = (share: DbShare) => {
    if (!share.is_active) return 'inactive'
    
    const now = new Date()
    if (share.expires_at && new Date(share.expires_at) < now) return 'expired'
    
    if (share.max_downloads && share.download_count >= share.max_downloads) return 'limit_reached'
    
    return 'active'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
      case 'limit_reached':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Limit Reached</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const copyShareLink = async (shareToken: string) => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    setActionLoading(`delete-${shareId}`)
    try {
      const result = await FileSharingService.deleteShare(shareId)
      if (result.success) {
        toast.success('Share link deactivated')
        await loadData()
      } else {
        toast.error(result.error || 'Failed to delete share')
      }
    } catch (error) {
      console.error('Error deleting share:', error)
      toast.error('Failed to delete share')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredShares = shares.filter(share => {
    // Search filter
    const matchesSearch = !searchTerm || 
      share.file?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      share.file?.original_name?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const status = getShareStatus(share)
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && status === 'active') ||
      (filterStatus === 'expired' && status === 'expired') ||
      (filterStatus === 'inactive' && status === 'inactive')

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Share Management</h2>
          <p className="text-muted-foreground">
            Manage your shared files and track sharing activity
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                  <p className="text-2xl font-bold">{stats.totalShares}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Shares</p>
                  <p className="text-2xl font-bold">{stats.activeShares}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{stats.expiredShares}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shared files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter: {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              All Shares
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('active')}>
              Active Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('expired')}>
              Expired Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
              Inactive Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shares Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Files</CardTitle>
          <CardDescription>
            Manage and monitor your shared files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShares.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No shared files found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start sharing files to see them here'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Shared</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShares.map((share) => {
                    const status = getShareStatus(share)
                    return (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium truncate max-w-[200px]">
                              {share.file?.original_name || 'Unknown File'}
                            </p>
                            {share.file?.size && (
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(share.file.size)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {share.permissions.slice(0, 2).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {share.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{share.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {share.download_count}
                            {share.max_downloads && (
                              <span className="text-muted-foreground">
                                /{share.max_downloads}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {share.expires_at ? (
                              <span className={new Date(share.expires_at) < new Date() ? 'text-red-500' : ''}>
                                {formatDistanceToNow(new Date(share.expires_at))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(share.created_at))} ago
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => copyShareLink(share.token)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedShare(share)
                                  setShowDetails(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleDeleteShare(share.id)}
                                disabled={actionLoading === `delete-${share.id}`}
                                className="text-red-600"
                              >
                                {actionLoading === `delete-${share.id}` ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this shared file
            </DialogDescription>
          </DialogHeader>

          {selectedShare && (
            <div className="space-y-6">
              {/* File Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">File Name</p>
                      <p className="font-medium">{selectedShare.file?.original_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="font-medium">
                        {selectedShare.file?.size ? formatBytes(selectedShare.file.size) : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">File Type</p>
                      <p className="font-medium">{selectedShare.file?.mime_type || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(getShareStatus(selectedShare))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Share Link</p>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/share/${selectedShare.token}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyShareLink(selectedShare.token)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(selectedShare.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                      <p className="font-medium">
                        {selectedShare.download_count}
                        {selectedShare.max_downloads && ` / ${selectedShare.max_downloads}`}
                      </p>
                    </div>
                    {selectedShare.expires_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Expires</p>
                        <p className="font-medium">
                          {new Date(selectedShare.expires_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Password Protected</p>
                      <p className="font-medium">
                        {selectedShare.password_hash ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedShare.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShareManagement
