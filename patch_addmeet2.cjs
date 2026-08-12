const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

code = code.replace(
  'endTime: new Date(endDate).toISOString(),\n        addMeet',
  'endTime: new Date(endDate).toISOString(),\n        addGoogleMeet: addMeet'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
