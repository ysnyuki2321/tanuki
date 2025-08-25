import { Button } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, FileCode, Folder, Settings } from "lucide-react"

export function DemoSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">See It In Action</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of Tanuki with our interactive demo
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Demo Preview */}
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                <div className="absolute inset-4 bg-card rounded-lg shadow-inner flex items-center justify-center">
                  <Button size="lg" className="gradient-primary text-white">
                    <Play className="w-6 h-6 mr-2" />
                    Launch Demo
                  </Button>
                </div>

                {/* Mock UI Elements */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>

                <div className="absolute bottom-6 right-6 flex gap-2">
                  <Badge variant="secondary">
                    <FileCode className="w-3 h-3 mr-1" />
                    Code Editor
                  </Badge>
                  <Badge variant="secondary">
                    <Folder className="w-3 h-3 mr-1" />
                    File Manager
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <FileCode className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Live Code Editing</h3>
                <p className="text-sm text-muted-foreground">
                  Edit JavaScript, Python, and more with real-time syntax highlighting
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Folder className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">File Management</h3>
                <p className="text-sm text-muted-foreground">
                  Drag & drop, zip preview, and intelligent file organization
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Settings className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Admin Tools</h3>
                <p className="text-sm text-muted-foreground">SSH integration, user management, and system monitoring</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
