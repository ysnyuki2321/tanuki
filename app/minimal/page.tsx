export default function MinimalPage() {
  return (
    <html>
      <head>
        <title>Minimal Test</title>
        <style>{`
          body {
            margin: 0;
            padding: 40px;
            font-family: Arial, sans-serif;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            color: white;
            min-height: 100vh;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
          }
          .box {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🚨 MINIMAL TEST PAGE 🚨</h1>
          
          <div className="box">
            <h2>Basic Tests</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>✅ HTML rendering</li>
              <li>✅ CSS styles working</li>
              <li>✅ Next.js routing working</li>
              <li>✅ Page accessible</li>
            </ul>
          </div>

          <div className="box">
            <h3>Next Steps:</h3>
            <p>1. Visit <strong>/minimal</strong> - if you see this, basic Next.js works</p>
            <p>2. Visit <strong>/diagnostic</strong> - to test all components</p>
            <p>3. Check browser console for errors</p>
          </div>

          <div className="box">
            <p><strong>Current URL:</strong> /minimal</p>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
          </div>
        </div>
      </body>
    </html>
  )
}
