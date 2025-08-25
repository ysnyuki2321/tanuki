"use client"

import { useState, useEffect } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log('HomePage component mounted')
    setMounted(true)
  }, [])

  console.log('HomePage rendering, mounted:', mounted)

  return (
    <main style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '40px 20px',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🦝 Tanuki Storage Platform
        </h1>

        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          {mounted ? 'React is working! ✅' : 'Loading React... ⏳'}
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          margin: '20px 0'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Debug Information</h2>
          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
            <li>✅ HTML structure is working</li>
            <li>✅ CSS styles are applying</li>
            <li>✅ JavaScript is executing</li>
            <li>{mounted ? '✅' : '⏳'} React hooks are working</li>
            <li>✅ Page is accessible</li>
          </ul>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3>Next Steps:</h3>
          <p>If you can see this page, the core application is working. The white screen issue might be related to specific components.</p>
        </div>
      </div>
    </main>
  )
}
