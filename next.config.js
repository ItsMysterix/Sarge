/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/sign-in',
        destination: '/sign-in/[[...index]]',
      },
      {
        source: '/sign-up',
        destination: '/sign-up/[[...index]]',
      },
    ]
  },
}

module.exports = nextConfig
