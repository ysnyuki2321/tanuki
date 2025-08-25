"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DemoSection } from "@/components/demo-section"
import { SetupStatus } from "@/components/setup-status"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />

      {/* Setup Status Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Platform Status</h2>
            <SetupStatus />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <DemoSection />
    </main>
  )
}
