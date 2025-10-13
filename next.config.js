/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// next.config.js

import "./src/env.js";
import withPWA from "@ducanh2912/next-pwa";


/** @type {import("next").NextConfig} */
const nextConfig = {
  // Your existing Next.js configuration goes here, e.g.,
  // reactStrictMode: true,
};

const withPwaConfig = withPWA({
  dest: "public",
  // Disable PWA features in development for a better dev experience
  disable: process.env.NODE_ENV === 'development', 
  register: true, 
  // @ts-ignore
  skipWaiting: true,
  // Cache pages visited during client-side navigation
  cacheOnFrontEndNav: true, 
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Add an offline fallback page path if you created one at /app/offline/page.tsx
  fallbacks: {
    document: '/offline',
  }, 
})(nextConfig);

export default withPwaConfig;