import type { NextConfig } from "next"

// The browser calls /api/mdm/* on this app; Next proxies it to the mdm backend (no CORS needed).
const mdmApiUrl = process.env.MDM_API_URL ?? "http://localhost:8095"

const nextConfig: NextConfig = {
  experimental: {
    // Next cuts proxied requests off after 30 s by default, but a long phone answer takes longer.
    // Kept above mdm's fabric.inference-timeout (180 s) so mdm, not the proxy, decides when to give up.
    proxyTimeout: 200_000,
  },
  async rewrites() {
    return [
      {
        source: "/api/mdm/:path*",
        destination: `${mdmApiUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
