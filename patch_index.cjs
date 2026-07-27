const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(/<link rel="icon" type="image\/png" href="\/logo-192\.png">/g, '<link rel="icon" sizes="16x16" href="/favicon-16x16.png">\n    <link rel="icon" sizes="32x32" href="/favicon-32x32.png">\n    <link rel="icon" sizes="48x48" href="/favicon-48x48.png">\n    <link rel="icon" type="image/x-icon" href="/favicon.ico">');

html = html.replace(/<link rel="apple-touch-icon" href="\/logo-192\.png">/g, '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n    <link rel="manifest" href="/manifest.webmanifest">');

fs.writeFileSync('index.html', html);
