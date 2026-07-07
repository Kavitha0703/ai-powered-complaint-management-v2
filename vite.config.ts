import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Workplace Hub",
          short_name: "Workplace Hub",
          description: "Digital Workplace Operations & Incident Remediation Platform",
          start_url: "/",
          display: "standalone",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          icons: [
            {
              src: "/logo.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable"
            },
            {
              src: "/logo-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/logo-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        devOptions: {
          enabled: false,
          type: "module"
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6000000
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
