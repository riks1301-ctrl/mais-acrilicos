/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "@resvg/resvg-js"],
    outputFileTracingIncludes: {
      "/api/**": [
        "./node_modules/sharp/**/*",
        "./node_modules/@img/**/*",
        "./node_modules/@resvg/**/*",
      ],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  poweredByHeader: false,
};
export default nextConfig;
