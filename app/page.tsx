export default function HomePage() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#8B5CF6',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      zIndex: 9999
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '30px', textAlign: 'center' }}>
        🦝 TANUKI PLATFORM
      </h1>

      <div style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '600px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
          🔍 HOMEPAGE TEST
        </h2>

        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <p>✅ Server-side rendering working</p>
          <p>✅ Next.js routing working</p>
          <p>✅ CSS styles working</p>
          <p>✅ Homepage accessible</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '16px'
        }}>
          <strong>WHAT THIS MEANS:</strong>
          <br />
          If you can see this purple page clearly, the basic Next.js infrastructure is working.
          <br />
          The white screen issue is likely caused by specific React components.
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        fontSize: '14px',
        opacity: '0.8',
        textAlign: 'center'
      }}>
        <p>Visit these test pages:</p>
        <p>/minimal - Basic HTML test</p>
        <p>/simple-test - Client component test</p>
        <p>/diagnostic - Component diagnostics</p>
      </div>
    </div>
  )
}
