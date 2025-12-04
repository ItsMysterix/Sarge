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
}

module.exports = nextConfig
