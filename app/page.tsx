"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
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

      <div className="p-8 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-white text-center">
          <div className="bg-white/10 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Test Status</h2>
            <ul className="text-left space-y-2">
              <li>✅ Next.js layout working</li>
              <li>✅ CSS variables loading</li>
              <li>✅ Tailwind classes working</li>
              <li>✅ AuthProvider working</li>
              <li>✅ Header component working</li>
              <li>✅ HeroSection component working</li>
              <li>✅ SetupStatus component working</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
