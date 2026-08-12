const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

// duration is missing
code = code.replace(
  '        meet_status: "Waiting",\n        participants: participants',
  '        meet_status: "Waiting",\n        participants: participants,\n        duration: "0:00"'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
