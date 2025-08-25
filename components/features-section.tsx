import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Database, FileText, Share2 } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "File Management",
    description:
      "Organize and manage your files with intuitive tools. Preview documents, images, and archives without downloading.",
  },
  {
    icon: Code2,
    title: "Code Editor",
    description:
      "Edit code directly in your browser with syntax highlighting and auto-completion for popular languages.",
  },
  {
    icon: Database,
    title: "Database Tools",
    description:
      "Visual database management with simple GUI. Create tables, run queries, and manage data easily.",
  },
  {
    icon: Share2,
    title: "Secure Sharing",
    description:
      "Share files securely with customizable permissions and time-limited access links.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-muted/20 via-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-gradient">Powerful Features</span> for Modern Developers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need to code, store, and collaborate efficiently in one integrated platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
