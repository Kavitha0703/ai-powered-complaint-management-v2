const fs = require('fs');
let code = fs.readFileSync('src/lib/EmailTemplates.ts', 'utf8');
code = code.replace(/adminAnnouncement\s*:/g, 'announcement:');
fs.writeFileSync('src/lib/EmailTemplates.ts', code);
