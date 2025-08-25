"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trash2, AlertTriangle, Loader2, Info } from 'lucide-react'
import { FileVersioningService } from '@/lib/file-versioning'
import { toast } from 'sonner'

interface VersionCleanupProps {
  fileId: string
  fileName: string
  totalVersions: number
  onCleanupComplete?: (deletedCount: number) => void
  disabled?: boolean
}

export function VersionCleanup({
  fileId,
  fileName,
  totalVersions,
  onCleanupComplete,
  disabled = false
}: VersionCleanupProps) {
  const [open, setOpen] = useState(false)
  const [keepCount, setKeepCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCleanup = async () => {
    if (keepCount >= totalVersions) {
      setError('Keep count must be less than total versions')
      return
    }

    if (keepCount < 1) {
      setError('Must keep at least 1 version')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await FileVersioningService.cleanupOldVersions(fileId, keepCount)

      if (result.success) {
        const deletedCount = result.deletedCount || 0
        toast.success(`Cleaned up ${deletedCount} old version${deletedCount !== 1 ? 's' : ''}`)
        onCleanupComplete?.(deletedCount)
        setOpen(false)
      } else {
        setError(result.error || 'Failed to cleanup versions')
      }
    } catch (err) {
      setError('Failed to cleanup versions')
      console.error('Error cleaning up versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const versionsToDelete = Math.max(0, totalVersions - keepCount)
  const canCleanup = versionsToDelete > 0 && !disabled

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!canCleanup}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cleanup Old Versions
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {!canCleanup 
                ? 'No versions to cleanup' 
                : 'Remove old versions to save storage space'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Cleanup Old Versions
          </DialogTitle>
          <DialogDescription>
            Remove old versions of "{fileName}" to save storage space
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Current situation:</strong> {totalVersions} total versions
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="keep-count">
              Keep most recent versions
            </Label>
            <Input
              id="keep-count"
              type="number"
              min="1"
              max={totalVersions - 1}
              value={keepCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                setKeepCount(Math.max(1, Math.min(totalVersions - 1, value)))
                setError(null)
              }}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Recommended: Keep 5-15 versions for most files
            </p>
          </div>

          {versionsToDelete > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will permanently delete {versionsToDelete} old version{versionsToDelete !== 1 ? 's' : ''}.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {keepCount >= totalVersions && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No versions will be deleted with current settings.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCleanup}
            disabled={loading || versionsToDelete === 0}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Cleaning up...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {versionsToDelete} Version{versionsToDelete !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default VersionCleanup
