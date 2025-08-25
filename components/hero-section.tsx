import { Button } from "@/components/ui/button"
import { TanukiLogo } from "./tanuki-logo"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] md:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-5" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <TanukiLogo size={64} />
          </div>

          {/* Enhanced Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Smart</span> Web Storage
            <br />
            <span className="text-foreground/90">Made Simple</span>
          </h1>

          {/* Enhanced Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Code, store, and collaborate seamlessly. Your complete digital workspace with built-in editor, database tools, and intelligent file management.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary text-white hover:opacity-90 transition-opacity">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
