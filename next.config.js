/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@hospigrow/api-client',
    '@hospigrow/auth',
    '@hospigrow/domain',
    '@hospigrow/i18n',
    '@hospigrow/offline',
    '@hospigrow/ui',
  ],
  experimental: {
    typedRoutes: true,
  },
  // OWASP-recommended security headers (server-rendered routes)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
