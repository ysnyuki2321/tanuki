import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Database, FileText, Share2, Terminal, Zap } from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Advanced Code Editor",
    description:
      "Full-featured code editor with syntax highlighting, auto-completion, and multi-language support. Edit your files directly in the browser.",
  },
  {
    icon: Database,
    title: "Database GUI Editor",
    description:
      "Visual database management with intuitive GUI. Edit tables, run queries, and manage your data without complex commands.",
  },
  {
    icon: FileText,
    title: "Smart File Management",
    description:
      "Organize, preview, and manage all your files. Support for zip preview without extraction and intelligent file categorization.",
  },
  {
    icon: Share2,
    title: "Secure File Sharing",
    description:
      "Share files and folders with customizable permissions. Generate secure links and control access with advanced sharing options.",
  },
  {
    icon: Terminal,
    title: "Storage Expansion via SSH",
    description:
      "Mount remote VPS nodes via SSH to expand your storage capacity. Seamlessly integrate additional disk space from multiple servers.",
  },
  {
    icon: Zap,
    title: "High Performance",
    description:
      "Optimized for speed and efficiency. Smooth experience on both mobile and desktop with minimal loading times.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional tools that solve real problems in web storage and file management
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm sm:text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
