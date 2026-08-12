const fs = require('fs');
let content = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');

// Update GoogleCalendarEvent type
content = content.replace(
  "type?: 'Personal' | 'Team';",
  "type?: 'Work' | 'Personal' | 'Reminder' | 'Meeting' | 'Task' | 'Important' | 'Team';"
);
fs.writeFileSync('src/lib/google/calendar.ts', content);
console.log("Updated types");
