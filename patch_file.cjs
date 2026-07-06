const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  'console.error("Model", model, "failed:", error.message || error);',
  'console.error("Model", model, "failed:", error.message || error);\n      require("fs").writeFileSync("/tmp/gemini_error.txt", String(error.message || error));'
);

fs.writeFileSync('api/_app.ts', code);
