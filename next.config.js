const { withSentryConfig } = require("@sentry/nextjs");

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

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "sarge",
    project: "sarge-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    automaticVercelMonitors: true,
  }
);
