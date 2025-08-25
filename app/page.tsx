"use client"

import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-16 p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 min-h-screen">
        <div className="max-w-4xl mx-auto text-white text-center">
          <h1 className="text-4xl font-bold mb-4">
            🦝 Tanuki Storage Platform
          </h1>

          <p className="text-xl mb-8">
            Testing with Header component...
          </p>

          <div className="bg-white/10 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Test Status</h2>
            <ul className="text-left space-y-2">
              <li>✅ Next.js layout working</li>
              <li>✅ CSS variables loading</li>
              <li>✅ Tailwind classes working</li>
              <li>✅ AuthProvider working</li>
              <li>✅ Header component working</li>
            </ul>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <p>If you can see this page with the header, the Header component works.</p>
            <p className="text-sm mt-2 opacity-75">Next: We'll add more components gradually.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
