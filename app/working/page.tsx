"use client"

import { useState, useEffect } from "react"

// Simple button component without external dependencies
const SimpleButton = ({ 
  children, 
  onClick, 
  variant = "primary" 
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
}) => {
  const baseStyle = {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  }

  const variants = {
    primary: {
      ...baseStyle,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
    },
    secondary: {
      ...baseStyle,
      background: "rgba(255,255,255,0.1)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.2)",
    }
  }

  return (
    <button style={variants[variant]} onClick={onClick}>
      {children}
    </button>
  )
}

// Simple card component
const SimpleCard = ({ 
  title, 
  description, 
  children 
}: { 
  title: string
  description: string
  children?: React.ReactNode
}) => {
  return (
    <div style={{
      background: "rgba(255,255,255,0.1)",
      padding: "24px",
      borderRadius: "12px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "8px" }}>
        {title}
      </h3>
      <p style={{ opacity: "0.8", marginBottom: "16px" }}>
        {description}
      </p>
      {children}
    </div>
  )
}

export default function WorkingHomePage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleGetStarted = () => {
    alert("Get Started clicked! 🎉")
  }

  const handleLearnMore = () => {
    alert("Learn More clicked! 📖")
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white"
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "24px" }}>🦝</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Tanuki</h1>
        </div>
        <nav style={{ display: "flex", gap: "20px" }}>
          <a href="#features" style={{ color: "white", textDecoration: "none" }}>Features</a>
          <a href="#about" style={{ color: "white", textDecoration: "none" }}>About</a>
          <a href="#contact" style={{ color: "white", textDecoration: "none" }}>Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "100px 20px",
        textAlign: "center",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <h1 style={{
          fontSize: "3.5rem",
          fontWeight: "bold",
          marginBottom: "20px",
          background: "linear-gradient(45deg, #ffffff, #e0e7ff)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Smart Web Storage Platform
        </h1>
        
        <p style={{
          fontSize: "1.2rem",
          opacity: "0.9",
          marginBottom: "40px",
          maxWidth: "600px",
          margin: "0 auto 40px auto"
        }}>
          Build, store, and collaborate seamlessly. Your complete digital workspace 
          with built-in code editor, database tools, and intelligent file management.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <SimpleButton onClick={handleGetStarted}>
            Get Started 🚀
          </SimpleButton>
          <SimpleButton variant="secondary" onClick={handleLearnMore}>
            Learn More 📖
          </SimpleButton>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: "80px 20px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <h2 style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "60px"
        }}>
          Powerful Features
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px"
        }}>
          <SimpleCard
            title="📁 File Management"
            description="Organize and manage your files with intuitive tools. Preview documents, images, and archives."
          />
          
          <SimpleCard
            title="💻 Code Editor"
            description="Edit code directly in your browser with syntax highlighting and auto-completion."
          />
          
          <SimpleCard
            title="🗄️ Database Tools"
            description="Visual database management with simple GUI. Create tables, run queries easily."
          />
          
          <SimpleCard
            title="🔒 Secure Sharing"
            description="Share files securely with customizable permissions and time-limited access."
          />
        </div>
      </section>

      {/* Status Section */}
      <section style={{
        padding: "60px 20px",
        background: "rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "30px" }}>
            System Status
          </h2>
          
          <div style={{
            background: "rgba(255,255,255,0.1)",
            padding: "30px",
            borderRadius: "12px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "2rem", color: "#4ade80" }}>✅</div>
                <div style={{ fontWeight: "600" }}>Application</div>
                <div style={{ opacity: "0.8" }}>Running</div>
              </div>
              
              <div>
                <div style={{ fontSize: "2rem", color: "#4ade80" }}>✅</div>
                <div style={{ fontWeight: "600" }}>Database</div>
                <div style={{ opacity: "0.8" }}>Connected</div>
              </div>
              
              <div>
                <div style={{ fontSize: "2rem", color: "#4ade80" }}>✅</div>
                <div style={{ fontWeight: "600" }}>Storage</div>
                <div style={{ opacity: "0.8" }}>Available</div>
              </div>
              
              <div>
                <div style={{ fontSize: "2rem", color: "#fbbf24" }}>⚠️</div>
                <div style={{ fontWeight: "600" }}>Setup</div>
                <div style={{ opacity: "0.8" }}>In Progress</div>
              </div>
            </div>
            
            <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <strong>Live Status:</strong> {time.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "40px 20px",
        textAlign: "center",
        background: "rgba(0,0,0,0.2)",
      }}>
        <p style={{ opacity: "0.7" }}>
          © 2024 Tanuki Platform. Built with Next.js and ❤️
        </p>
      </footer>
    </div>
  )
}
