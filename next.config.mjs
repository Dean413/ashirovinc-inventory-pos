import withPWA from "next-pwa"

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // disables PWA in dev
})({
  useCache: true,
  reactStrictMode: true,
});

export default nextConfig;
