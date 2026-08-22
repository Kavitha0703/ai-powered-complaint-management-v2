const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{ handleJoinGoogleMeet\(m\.id\); window\.open\(m\.call_summary\?\.meet_link \|\| "", "_blank"\); \}\}/,
  'onClick={() => { window.open(m.call_summary?.meet_link || "", "_blank"); }}'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched");
