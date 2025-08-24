import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const topics = [
  { title: "Getting Started", desc: "Install, configure, and deploy Tanuki in minutes." },
  { title: "File Manager", desc: "Upload, organize, and share files securely." },
  { title: "Code Editor", desc: "Edit code with Monaco (planned) and Prettier support." },
  { title: "Database GUI", desc: "Connect to Postgres/MySQL and run queries safely." },
  { title: "Admin & Audit", desc: "Manage users, roles, quotas and view audit logs." },
  { title: "SSH Storage", desc: "Mount and manage remote nodes via SSH." },
]

export function DocsSection() {
  return (
    <section id="docs" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">Documentation</h2>
          <p className="text-muted-foreground text-lg">Guides and references to build with Tanuki</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((t) => (
            <Card key={t.title}>
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">Read more</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

