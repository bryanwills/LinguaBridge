import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Trace dependencies from the monorepo root so workspace packages resolve.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
