const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  'return { text: typeof fallbackValue === "string" ? fallbackValue : JSON.stringify(fallbackValue) };',
  'return { text: JSON.stringify({ ...fallbackValue, text: "Error: " + (lastError ? String(lastError.message || lastError) : "Unknown error") }) };'
);

fs.writeFileSync('api/_app.ts', code);
