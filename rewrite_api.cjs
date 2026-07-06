const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

// Replace models array with dynamic models parameter
code = code.replace(
  /const models = \[\s*"gemini-3\.5-flash",\s*"gemini-3\.1-pro-preview",\s*"gemini-3\.1-flash-lite",\s*"gemini-flash-latest"\s*\];/,
  `// Dynamic models array\n  const models = params.model ? [params.model, "gemini-3.5-flash", "gemini-3.1-pro-preview"] : ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];`
);

fs.writeFileSync('api/_app.ts', code);
console.log("Rewrote api/_app.ts models");
