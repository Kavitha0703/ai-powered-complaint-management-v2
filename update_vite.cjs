const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
const replacement = `          icons: [
            {
              src: "/favicon-16x16.png",
              sizes: "16x16",
              type: "image/png"
            },
            {
              src: "/favicon-32x32.png",
              sizes: "32x32",
              type: "image/png"
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
code = code.replace(/icons:\s*\[[\s\S]*?\]/, replacement);
fs.writeFileSync('vite.config.ts', code);
