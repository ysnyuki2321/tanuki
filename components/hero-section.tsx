import { Button } from "@/components/ui/button"
import { TanukiLogo } from "./tanuki-logo"
import { ArrowRight, Code, Database, Share, Zap } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <TanukiLogo size={80} />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Advanced</span>
            <br />
            Web Storage
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            More than just storage. Code, edit databases, share files, and manage your digital workspace with
            professional-grade tools.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-full border text-xs sm:text-sm">
              <Code className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium">Code Editor</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-full border text-xs sm:text-sm">
              <Database className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium">Database GUI</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-full border text-xs sm:text-sm">
              <Share className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium">File Sharing</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-full border text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium">Storage Expansion</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="gradient-primary text-white hover:opacity-90 transition-opacity w-full sm:w-auto">
              Try Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 bg-transparent w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
