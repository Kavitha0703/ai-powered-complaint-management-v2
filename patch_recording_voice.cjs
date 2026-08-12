const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

code = code.replace(
  'isCalendarPanelOpen || \n      !!selectedCallDetail;',
  'isCalendarPanelOpen || \n      !!selectedCallDetail || \n      isRecordingVoice;'
);

code = code.replace(
  ', isCalendarPanelOpen, selectedCallDetail]);',
  ', isCalendarPanelOpen, selectedCallDetail, isRecordingVoice]);'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched isRecordingVoice");
