/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
    outputFileTracingIncludes: {
      "/api/**": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  poweredByHeader: false,
};
export default nextConfig;
