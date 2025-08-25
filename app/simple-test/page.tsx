"use client"

export default function SimpleTestPage() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000080',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      zIndex: 9999
    }}>
      <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>
        🦝 SIMPLE TEST - CLIENT COMPONENT
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <p style={{ marginBottom: '10px' }}>
          <strong>✅ React client component working</strong>
        </p>
        <p style={{ marginBottom: '10px' }}>
          <strong>✅ "use client" directive working</strong>
        </p>
        <p style={{ marginBottom: '10px' }}>
          <strong>✅ CSS-in-JS working</strong>
        </p>
        <p style={{ marginBottom: '20px' }}>
          <strong>✅ Next.js routing working</strong>
        </p>
        
        <div style={{ fontSize: '14px', opacity: '0.8' }}>
          <p>Current URL: /simple-test</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Instructions:</strong>
        <br />
        If you can see this blue page clearly with white text,
        <br />
        then the basic React setup is working properly.
      </div>
    </div>
  )
}
