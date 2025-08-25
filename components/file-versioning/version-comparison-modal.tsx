"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  GitCompare,
  ArrowRight,
  Clock,
  FileText,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { FileVersioningService, type VersionComparison } from '@/lib/file-versioning'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

interface VersionComparisonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
  version1: number
  version2: number
}

export function VersionComparisonModal({
  open,
  onOpenChange,
  fileId,
  fileName,
  version1,
  version2
}: VersionComparisonModalProps) {
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && version1 && version2) {
      loadComparison()
    }
  }, [open, fileId, version1, version2])

  const loadComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await FileVersioningService.compareVersions(fileId, version1, version2)
      if (result) {
        setComparison(result)
      } else {
        setError('Failed to load version comparison')
      }
    } catch (err) {
      setError('Failed to compare versions')
      console.error('Error comparing versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadVersion = async (versionNumber: number) => {
    setDownloading(versionNumber)
    try {
      const result = await FileVersioningService.downloadVersion(fileId, versionNumber)

      if (result.success && result.url) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = result.url
        link.download = `${fileName}_v${versionNumber}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Download started')
      } else {
        toast.error(result.error || 'Failed to download version')
      }
    } catch (err) {
      toast.error('Failed to download version')
      console.error('Error downloading version:', err)
    } finally {
      setDownloading(null)
    }
  }

  const getSizeDifferenceInfo = (sizeDiff: number) => {
    const absDiff = Math.abs(sizeDiff)
    const isIncrease = sizeDiff > 0
    const isDecrease = sizeDiff < 0
    
    return {
      icon: isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus,
      color: isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground',
      text: sizeDiff === 0 ? 'No change' : `${isIncrease ? '+' : '-'}${formatBytes(absDiff)}`
    }
  }

  const formatTimeDifference = (timeDiff: number) => {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!comparison && !loading && !error) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Compare Versions - {fileName}
          </DialogTitle>
          <DialogDescription>
            Detailed comparison between version {Math.min(version1, version2)} and version {Math.max(version1, version2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : comparison ? (
            <>
              {/* Comparison Overview */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Comparison Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {formatTimeDifference(comparison.timeDifference)}
                    </div>
                    <div className="text-sm text-muted-foreground">Time Difference</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                      getSizeDifferenceInfo(comparison.sizeDifference).color
                    }`}>
                      {React.createElement(getSizeDifferenceInfo(comparison.sizeDifference).icon, { 
                        className: "w-5 h-5" 
                      })}
                      {getSizeDifferenceInfo(comparison.sizeDifference).text}
                    </div>
                    <div className="text-sm text-muted-foreground">Size Difference</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {Math.abs(comparison.newVersion.version_number - comparison.oldVersion.version_number)}
                    </div>
                    <div className="text-sm text-muted-foreground">Version Gap</div>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Older Version */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Version {comparison.oldVersion.version_number}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Older</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadVersion(comparison.oldVersion.version_number)}
                      disabled={downloading === comparison.oldVersion.version_number}
                    >
                      {downloading === comparison.oldVersion.version_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(comparison.oldVersion.created_at))} ago</span>
                    </div>
                    
                    {comparison.oldVersion.creator && (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{comparison.oldVersion.creator.full_name || comparison.oldVersion.creator.email}</span>
                      </div>
                    )}
                    
                    {comparison.oldVersion.size && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span>{formatBytes(comparison.oldVersion.size)}</span>
                      </div>
                    )}
                  </div>
                  
                  {comparison.oldVersion.changes_description && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <strong>Changes:</strong> {comparison.oldVersion.changes_description}
                    </div>
                  )}
                </div>

                {/* Newer Version */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        Version {comparison.newVersion.version_number}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Newer</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadVersion(comparison.newVersion.version_number)}
                      disabled={downloading === comparison.newVersion.version_number}
                    >
                      {downloading === comparison.newVersion.version_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(comparison.newVersion.created_at))} ago</span>
                    </div>
                    
                    {comparison.newVersion.creator && (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{comparison.newVersion.creator.full_name || comparison.newVersion.creator.email}</span>
                      </div>
                    )}
                    
                    {comparison.newVersion.size && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span>{formatBytes(comparison.newVersion.size)}</span>
                      </div>
                    )}
                  </div>
                  
                  {comparison.newVersion.changes_description && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <strong>Changes:</strong> {comparison.newVersion.changes_description}
                    </div>
                  )}
                </div>
              </div>

              {/* Change Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Change Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Version progression:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{comparison.oldVersion.version_number}</Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge variant="default">v{comparison.newVersion.version_number}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Time elapsed:</span>
                    <span>{formatTimeDifference(comparison.timeDifference)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Size change:</span>
                    <span className={getSizeDifferenceInfo(comparison.sizeDifference).color}>
                      {getSizeDifferenceInfo(comparison.sizeDifference).text}
                    </span>
                  </div>
                  
                  {comparison.oldVersion.checksum && comparison.newVersion.checksum && (
                    <div className="flex items-center justify-between">
                      <span>Content changed:</span>
                      <span className={
                        comparison.oldVersion.checksum !== comparison.newVersion.checksum 
                          ? 'text-orange-500' 
                          : 'text-green-500'
                      }>
                        {comparison.oldVersion.checksum !== comparison.newVersion.checksum ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VersionComparisonModal
