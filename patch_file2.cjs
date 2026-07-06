const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

code = code.replace(
  /require\("fs"\)\.writeFileSync/g,
  'require("fs").writeFileSync' // wait, require is not defined!
);
code = code.replace(
  'require("fs").writeFileSync("/tmp/gemini_error.txt", String(error.message || error));',
  '// removed'
);

// Instead of require, we will write a catch block that sends the error as part of the JSON!
code = code.replace(
  'return { text: typeof fallbackValue === "string" ? fallbackValue : JSON.stringify(fallbackValue), errorMsg: lastError ? String(lastError.message || lastError) : "Unknown error" };',
  'return { text: JSON.stringify({ ...fallbackValue, text: "Error: " + (lastError ? String(lastError.message || lastError) : "Unknown error") }) };'
);

fs.writeFileSync('api/_app.ts', code);
