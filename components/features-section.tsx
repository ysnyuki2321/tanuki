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
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Essential tools for modern web storage and file management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
