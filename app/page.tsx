"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { DocsSection } from "@/components/docs-section"

export default function HomePage() {
  return (
    <main className="min-h-screen pt-16">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <DocsSection />
    </main>
  )
}
