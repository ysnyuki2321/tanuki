export default function HomePage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="max-w-4xl mx-auto text-white text-center">
        <h1 className="text-4xl font-bold mb-4">
          🦝 Tanuki Storage Platform
        </h1>

        <p className="text-xl mb-8">
          Testing basic layout without complex components...
        </p>

        <div className="bg-white/10 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Status</h2>
          <ul className="text-left space-y-2">
            <li>✅ Next.js layout working</li>
            <li>✅ CSS variables loading</li>
            <li>✅ Tailwind classes working</li>
            <li>✅ Basic components rendering</li>
          </ul>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <p>If you can see this styled page without white screen, the basic setup works.</p>
          <p className="text-sm mt-2 opacity-75">Next: We'll add components one by one to find the issue.</p>
        </div>
      </div>
    </main>
  )
}
