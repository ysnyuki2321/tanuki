"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import RealCodeEditor from "@/components/code-editor/real-code-editor"

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <RealCodeEditor />
      </div>
    </ProtectedRoute>
  )
}
