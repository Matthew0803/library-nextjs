/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for Vercel deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig

