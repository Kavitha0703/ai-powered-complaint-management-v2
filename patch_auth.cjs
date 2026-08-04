const fs = require('fs');
let code = fs.readFileSync('src/lib/google/auth.ts', 'utf8');
code = code.replace(/console\.log\("NEW GOOGLE LOGIN CODE - VERSION 2"\);\n\s*alert\("New Google Login Code Running"\);\n\s*/g, '');
code = code.replace(/scopes: ".*?"/, 'scopes: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar"');
fs.writeFileSync('src/lib/google/auth.ts', code);
