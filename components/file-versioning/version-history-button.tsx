"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { History } from 'lucide-react'
import { FileVersionsModal } from './file-versions-modal'

interface VersionHistoryButtonProps {
  fileId: string
  fileName: string
  onVersionRestored?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showLabel?: boolean
  className?: string
}

export function VersionHistoryButton({
  fileId,
  fileName,
  onVersionRestored,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
  className
}: VersionHistoryButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setShowModal(true)}
              className={className}
            >
              <History className="w-4 h-4" />
              {showLabel && <span className="ml-2">Version History</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View version history</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FileVersionsModal
        open={showModal}
        onOpenChange={setShowModal}
        fileId={fileId}
        fileName={fileName}
        onVersionRestored={onVersionRestored}
      />
    </>
  )
}

export default VersionHistoryButton
