const fs = require('fs');
let config = fs.readFileSync('vite.config.ts', 'utf8');

const replacement = `icons: [
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
          ]`;

config = config.replace(/icons: \[\s*\{\s*src: "\/logo\.svg",\s*sizes: "512x512",\s*type: "image\/svg\+xml",\s*purpose: "any maskable"\s*\}\s*\]/g, replacement);

fs.writeFileSync('vite.config.ts', config);
console.log("Patched vite.config.ts successfully");
