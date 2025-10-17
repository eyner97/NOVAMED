// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Usa un prefijo que NO choque con API Routes de Next
      { source: '/backend/:path*', destination: 'http://127.0.0.1:4000/:path*' },
    ];
  },
};
export default nextConfig;
