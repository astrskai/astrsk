import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";
import license from "rollup-plugin-license";
import path from "path";
import { version } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ["@electric-sql/pglite", "minijinja-js"],
  },
  // https://pglite.dev/docs/bundler-support#additional-configuration-for-the-multi-tab-worker
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            includePrivate: false,
            output: {
              file: path.join(__dirname, 'THIRD-PARTY-NOTICES.txt'),
              template(dependencies) {
                const header = `Third-Party Software Notices and License Texts

This project uses the following third-party software. The full text of each license is included below.

================================================================================

`;
                
                const licenseGroups = dependencies.reduce((acc: Record<string, any[]>, dep) => {
                  const license = dep.license || 'Unknown';
                  if (!acc[license]) acc[license] = [];
                  acc[license].push(dep);
                  return acc;
                }, {} as Record<string, any[]>);
                
                let content = header;
                
                // Add summary
                content += 'License Summary:\n';
                Object.entries(licenseGroups)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .forEach(([license, deps]) => {
                    content += `  ${license}: ${deps.length} packages\n`;
                  });
                
                content += `\nTotal packages: ${dependencies.length}\n`;
                content += '\n================================================================================\n\n';
                
                // Add package details
                dependencies
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  .forEach(dep => {
                    content += `Package: ${dep.name}\n`;
                    content += `Version: ${dep.version}\n`;
                    content += `License: ${dep.license || 'Unknown'}\n`;
                    if (dep.repository) {
                      const repo = typeof dep.repository === 'string' 
                        ? dep.repository 
                        : dep.repository.url;
                      if (repo) content += `Repository: ${repo}\n`;
                    }
                    if (dep.author) content += `Author: ${dep.author}\n`;
                    content += '\n';
                    if (dep.licenseText) {
                      content += dep.licenseText + '\n';
                    }
                    content += '\n--------------------------------------------------------------------------------\n\n';
                  });
                
                return content;
              }
            },
            allow: {
              test: 'MIT OR Apache-2.0 OR Apache-2.0 WITH LLVM-exception OR BSD-3-Clause OR BSD-2-Clause OR ISC OR 0BSD OR CC0-1.0 OR CC-BY-4.0 OR Unlicense OR Python-2.0 OR BlueOak-1.0.0',
              failOnUnlicensed: false,
              failOnViolation: false
            }
          }
        })
      ]
    }
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "astrsk",
        short_name: "astrsk",
        description: "astrsk",
        theme_color: "#2a313a",
        background_color: "#2a313a",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        scope: "/",
        start_url: "/?mode=standalone",
        orientation: "portrait-primary",
      },

      workbox: {
        globPatterns: ["**/*"], // Pre-cache all files
        globIgnores: ["manifest.webmanifest"], // Do not pre-cache the manifest file
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20MB
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
});
