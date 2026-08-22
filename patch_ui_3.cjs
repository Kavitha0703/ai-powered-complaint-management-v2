const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => handleJoinGoogleMeet\(activeMeeting\.id\)\}/g,
  'onClick={() => { if (activeMeeting.call_summary?.meet_link) window.open(activeMeeting.call_summary.meet_link, "_blank"); }}'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched header buttons");
