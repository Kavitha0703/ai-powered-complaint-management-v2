const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injection = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="apple-touch-icon" href="/logo-192.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/logo-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/logo-512.png" />
`;

if (!code.includes("manifest.webmanifest")) {
  code = code.replace('<link rel="icon" type="image/svg+xml" href="/logo.svg" />', '<link rel="icon" type="image/svg+xml" href="/logo.svg" />' + injection);
  fs.writeFileSync('index.html', code);
  console.log("Patched index.html");
}
