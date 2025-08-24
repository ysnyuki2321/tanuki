import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["5 GB storage", "Basic file manager", "Public sharing"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    features: ["200 GB storage", "Code editor", "Database GUI", "Secure links"],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/mo",
    features: ["1 TB storage", "Team members", "Admin dashboard", "SSH storage nodes"],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">Simple pricing</h2>
          <p className="text-muted-foreground text-lg">Choose a plan that fits your workflow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? "border-primary/30 shadow-lg" : undefined}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold mr-1">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={plan.highlighted ? "gradient-primary text-white w-full" : "w-full"}>{plan.cta}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

