import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Set to false for production to catch all type errors
    ignoreBuildErrors: process.env.NODE_ENV === "production" ? false : true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
