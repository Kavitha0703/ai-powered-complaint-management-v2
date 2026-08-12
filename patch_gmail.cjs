const fs = require('fs');
let code = fs.readFileSync('src/components/GmailEmailCenterPanel.tsx', 'utf-8');
code = code.replace(
  '<div className="flex-1 overflow-y-auto p-6 bg-slate-950/60">',
  '<div className="flex-1 min-h-0 overflow-y-auto p-6 bg-slate-950/60">'
);
fs.writeFileSync('src/components/GmailEmailCenterPanel.tsx', code);
