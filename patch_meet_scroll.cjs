const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');
code = code.replace(
  'setIsFetchingMeetings(false);\n    setTimeout(() => scrollToBottom(), 80);',
  'setIsFetchingMeetings(false);'
);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
