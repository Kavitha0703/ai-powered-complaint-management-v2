const fs = require('fs');
let codeCal = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');
codeCal = codeCal.replace(/"quiet-alchemy-0lkqp"/g, '"default-project"');
fs.writeFileSync('src/lib/google/calendar.ts', codeCal);

let codeGmail = fs.readFileSync('src/lib/google/gmail.ts', 'utf-8');
codeGmail = codeGmail.replace(/"quiet-alchemy-0lkqp"/g, '"default-project"');
fs.writeFileSync('src/lib/google/gmail.ts', codeGmail);

console.log("Patched quiet-alchemy");
