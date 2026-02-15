/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Force fresh build by updating config
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static optimization for pages to ensure fresh builds
  // experimental: {
  //   isrMemoryCacheSize: 0,
  // },
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
  async redirects() {
    return [
      // Sovereign Hub Consolidation
      { source: '/environments', destination: '/orchestration', permanent: true },
      { source: '/deployments', destination: '/orchestration', permanent: true },
      { source: '/secrets', destination: '/orchestration', permanent: true },
      { source: '/cost', destination: '/governance', permanent: true },
      { source: '/drift', destination: '/governance', permanent: true },
      { source: '/audit', destination: '/governance', permanent: true },
      { source: '/logs', destination: '/observability', permanent: true },
      { source: '/metrics', destination: '/observability', permanent: true },
      { source: '/traffic', destination: '/observability', permanent: true },

      // Canonicalize host (Optional, handled by Vercel usually, but kept for stability)
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'host', value: '^(?!v0-sarge\\.vercel\\.app$).*' }],
        destination: 'https://v0-sarge.vercel.app/:path*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
