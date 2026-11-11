import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const rootAssetsDir = path.join(repoRoot, "assets");

const ASSET_MIME_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

function isIgnoredAssetName(name: string): boolean {
  return name.startsWith(".") || name.toLowerCase() === "readme.md";
}

function copyAssetsRecursively(srcDir: string, destDir: string): void {
  if (!fs.existsSync(srcDir)) return;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (isIgnoredAssetName(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyAssetsRecursively(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Exposes the shared repository-root assets/ folder at /assets/... in both
 * Vite dev server and built dist/assets/ output.
 */
function rootAssetsPlugin(): Plugin {
  return {
    name: "archbench-root-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || "").split("?")[0];
        if (!cleanUrl.startsWith("/assets/")) return next();

        let relPath: string;
        try {
          relPath = decodeURIComponent(cleanUrl.slice("/assets/".length));
        } catch {
          return next();
        }

        const targetFile = path.resolve(rootAssetsDir, relPath);
        const allowedPrefix = rootAssetsDir + path.sep;
        if (
          !targetFile.startsWith(allowedPrefix) ||
          isIgnoredAssetName(path.basename(targetFile))
        ) {
          return next();
        }

        try {
          if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
            const ext = path.extname(targetFile).toLowerCase();
            res.setHeader("Content-Type", ASSET_MIME_TYPES[ext] || "application/octet-stream");
            fs.createReadStream(targetFile).pipe(res);
            return;
          }
        } catch {
          // Fall through to Vite's normal handling if file cannot be read
        }
        next();
      });
    },
    closeBundle() {
      copyAssetsRecursively(rootAssetsDir, path.resolve(__dirname, "dist/assets"));
    },
  };
}

export default defineConfig({
  plugins: [react(), rootAssetsPlugin()],
  root: ".",
  server: {
    port: 3000,
    fs: {
      allow: [__dirname, rootAssetsDir],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/client"),
      "@assets": rootAssetsDir,
    },
  },
});

