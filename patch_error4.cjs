const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  'return { text: JSON.stringify({ ...fallbackValue, text: "Error: " + (lastError ? String(lastError.message || lastError) : "Unknown error") }) };',
  'return { text: typeof fallbackValue === "string" ? fallbackValue : JSON.stringify(fallbackValue) };'
);

fs.writeFileSync('api/_app.ts', code);
