import type { NextConfig } from "next";
// a plain JS module, shared with the scripts
import { loadConfig } from "./scripts/config.mjs";

// The site is a static export (out/), served by GitHub Pages or any static host. Under GitHub Pages a project
// site lives at /<repo>: scripts/deploy.mjs sets MUSEUM_BASE_PATH for the build.
const basePath = process.env.MUSEUM_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  // the config (museum.config.json), for the app's server and client code alike (src/lib/config.ts)
  env: {
    MUSEUM_CONFIG: JSON.stringify(loadConfig()),
    MUSEUM_BASE_PATH: basePath,
  },
};

export default nextConfig;
