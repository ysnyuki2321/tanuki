export default function HomePage() {
  // Completely minimal test - no React hooks, no client-side JS
  return (
    <div style={{
      backgroundColor: '#ff0000',
      color: '#ffffff',
      fontSize: '24px',
      padding: '50px',
      textAlign: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>
        🚨 EMERGENCY TEST PAGE 🚨
      </h1>

      <p style={{ fontSize: '20px', margin: '20px 0' }}>
        If you can see this red page, then:
      </p>

      <ul style={{
        listStyle: 'none',
        padding: 0,
        fontSize: '18px',
        textAlign: 'left',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <li>✅ Next.js is serving pages</li>
        <li>✅ HTML is rendering</li>
        <li>✅ CSS styles work</li>
        <li>✅ The route is accessible</li>
      </ul>

      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#ffffff',
        color: '#000000',
        borderRadius: '10px'
      }}>
        <strong>INSTRUCTIONS:</strong>
        <br />
        If you can see this, the problem was with React components.
        <br />
        If you still see white screen, there's a deeper infrastructure issue.
      </div>
    </div>
  )
}
