"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // You could log the error to an error reporting service
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Internal error occurred</h2>
              <p className="text-sm text-muted-foreground">Please try again. If the issue persists, contact the administrator.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>Go home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

