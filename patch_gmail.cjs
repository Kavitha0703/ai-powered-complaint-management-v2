const fs = require('fs');
let code = fs.readFileSync('src/lib/google/gmail.ts', 'utf8');
code = code.replace(/export const EmailTemplates = {[\s\S]*?\n};\n/g, '');
code = code.replace(/export const EmailTemplates = {[\s\S]*/g, '');
fs.writeFileSync('src/lib/google/gmail.ts', code);
