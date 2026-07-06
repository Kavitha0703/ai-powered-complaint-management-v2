const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  'lastError = error;',
  'console.error("Model", model, "failed:", error.message || error);\n      lastError = error;'
);

fs.writeFileSync('api/_app.ts', code);
