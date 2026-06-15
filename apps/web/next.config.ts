import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Trace dependencies from the monorepo root so workspace packages resolve.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Allow LAN-origin dev requests (e.g. iPhone on same Wi‑Fi).
  allowedDevOrigins: ["localhost", "127.0.0.1", "172.16.1.56"],
};

export default nextConfig;
