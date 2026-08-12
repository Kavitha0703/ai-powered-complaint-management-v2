const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

code = code.replace(/className="fixed top-0[^"]*z-50/g, (match) => {
  return match.replace('z-50', 'z-[1000]');
});

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched fixed top-0");
