/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Show ESLint errors
  },
  typescript: {
    ignoreBuildErrors: false, // Show TypeScript errors - CRITICAL FIX
  },
  images: {
    unoptimized: true,
  },
  // Add better error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Improve build performance
  swcMinify: true,
  // Better error overlay
  reactStrictMode: true,
}

export default nextConfig
