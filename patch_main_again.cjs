const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const regex = /window\.addEventListener\('appinstalled'[\s\S]*?\}\);\s*createRoot/m;
code = code.replace(regex, "createRoot");

fs.writeFileSync('src/main.tsx', code);
console.log("Cleaned up main.tsx");
