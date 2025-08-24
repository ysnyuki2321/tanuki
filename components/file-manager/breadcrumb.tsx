"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbProps {
  currentPath: string
  onPathChange: (path: string) => void
}

export function Breadcrumb({ currentPath, onPathChange }: BreadcrumbProps) {
  const pathParts = currentPath.split("/").filter(Boolean)

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Button variant="ghost" size="sm" onClick={() => onPathChange("/")} className="h-8 px-2">
        <Home className="w-4 h-4" />
      </Button>

      {pathParts.map((part, index) => {
        const path = "/" + pathParts.slice(0, index + 1).join("/")
        const isLast = index === pathParts.length - 1

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPathChange(path)}
              className={`h-8 px-2 ${isLast ? "font-medium" : ""}`}
            >
              {part}
            </Button>
          </div>
        )
      })}
    </nav>
  )
}
