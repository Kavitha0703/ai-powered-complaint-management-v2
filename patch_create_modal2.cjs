const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// Replace duplicate color
code = code.replace(
  'type: eventType,\n        color: eventColor,\n      visibility: eventVisibility,\n      color: eventColor,',
  'type: eventType,\n      visibility: eventVisibility,\n      color: eventColor,'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched Calendar Create Event Modal duplicate color");
