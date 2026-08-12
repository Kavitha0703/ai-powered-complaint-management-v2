const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

code = code.replace(
  'window.open("https://calendar.google.com/calendar/u/0/r/eventedit", "_blank");',
  'setIsCalendarPanelOpen(true);'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched AdminTeamChat");
