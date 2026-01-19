/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ["react-pdf", "pdfjs-dist"],

  turbopack: {}, // 🔑 CRITICAL: tells Next “no webpack, no merge, no guessing”

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.moralclarity.ai" }],
        destination: "https://moralclarity.ai/:path*",
        permanent: true,
      },
      {
        source: "/workspace2/:path*",
        destination: "/app",
        permanent: true,
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      [
        "connect-src 'self'",
        "https://moralclarity.ai",
        "https://www.moralclarity.ai",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://api.openai.com",
        "https://api.stripe.com",
        "https://vitals.vercel-insights.com",
      ].join(" "),
      [
        "frame-ancestors 'self'",
        "https://*.webflow.io",
        "https://moral-clarity-ai-2-0.webflow.io",
        "https://studio.moralclarity.ai",
      ].join(" "),
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.supabase.co",
      "font-src 'self' data: https:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
