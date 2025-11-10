// next.config.mjs
import withPWA from "next-pwa";

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,

  // ⚙️ Cache your API + pages + static files
  runtimeCaching: [
    {
      // 🔹 Supabase REST API caching
      urlPattern: /^https:\/\/[a-zA-Z0-9_-]+\.supabase\.co\/rest\/v1\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api-cache",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // 🔹 Cache static Next.js assets (JS, CSS, fonts, images)
      urlPattern: ({ request }) =>
        ["script", "style", "font", "image"].includes(request.destination),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
      },
    },
    {
      // 🔹 Cache HTML/navigation requests
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],

  reactStrictMode: true,
});

export default nextConfig;
