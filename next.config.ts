import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "maplibre-gl"],
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
