import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { FeatureFlagsProvider } from "@/contexts/feature-flags-context"
import { ThemeProvider } from "@/components/theme-provider"
import ErrorBoundary from "@/components/error-boundary"
import EnvInjector from "@/components/env-injector"
import { getClientSafeEnvVars } from "@/lib/env-utils"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Tanuki - Advanced Web Storage Platform",
  description: "Professional web storage with code editing, database management, and file sharing capabilities",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clientEnvVars = getClientSafeEnvVars()

  return (
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased">
        <EnvInjector envVars={clientEnvVars} />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
