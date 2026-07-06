const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  'lastError = error;',
  'lastError = error;\n      console.error("Model " + model + " failed with: " + String(error.message || error));'
);

fs.writeFileSync('api/_app.ts', code);
