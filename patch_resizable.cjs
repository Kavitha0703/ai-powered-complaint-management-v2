const fs = require('fs');
let code = fs.readFileSync('src/components/ResizablePanel.tsx', 'utf-8');
code = code.replace(
  '<div className="flex-1 w-full h-full min-w-0 overflow-hidden">',
  '<div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden">'
);
fs.writeFileSync('src/components/ResizablePanel.tsx', code);
