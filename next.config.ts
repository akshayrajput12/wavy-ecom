import type { NextConfig } from "next";

// Storage host from env too, so a custom Supabase domain still optimises.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Catalog import (backend/catalog-import): CJS with archiver/unzipper deps; load it from node_modules, don't bundle it.
  serverExternalPackages: ["exceljs"],
  compress: true, // gzip under `next start`; turn off only if a proxy/CDN in front already compresses
  images: {
    formats: ["image/avif", "image/webp"],
    // Fewer srcset candidates = smaller HTML and fewer cached renditions. Defaults add 2048/3840 and 32/48.
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Uploads use unique UUID paths (backend/admin/uploads.ts), so a long TTL never serves a stale file.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      ...(supabaseHost && !supabaseHost.endsWith(".supabase.co") ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
    // ponytail: the dev disk cache (.next/dev/cache/turbopack) corrupted twice under bulk edits ("conflicting effects
    // for the same key" panic). Off = slower cold `next dev` start; turn back on once Turbopack fixes it.
    turbopackFileSystemCacheForDev: false,
  },
  // Invoice PDFs embed these fonts (read from disk at render time, so the tracer can't see them).
  outputFileTracingIncludes: {
    "/api/**/invoice": ["./src/backend/invoices/fonts/*.ttf"],
    "/api/admin/invoices": ["./src/backend/invoices/fonts/*.ttf"],
  },
};

export default nextConfig;
