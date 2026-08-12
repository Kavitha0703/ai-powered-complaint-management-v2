const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex items-center gap-2 pt-1">/, '</div>\n              </div>\n              <div className="flex items-center gap-2 pt-1">');

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched divs");
