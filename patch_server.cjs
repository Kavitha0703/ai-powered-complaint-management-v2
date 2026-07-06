const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /initializeApp\(\)\.catch\(\(err\) => \{\n  console\.error\("Failed to start server:", err\);\n\}\);/;

const replacement = `export default app;

if (!process.env.VERCEL) {
  initializeApp().catch((err) => {
    console.error("Failed to start server:", err);
  });
}`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log('done');
} else {
    console.log('not found');
}
