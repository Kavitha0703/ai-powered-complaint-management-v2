const fs = require('fs');
let code = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');

code = code.replace(
  "type?: 'Personal' | 'Team';",
  "type?: 'Work' | 'Personal' | 'Reminder' | 'Meeting' | 'Task' | 'Important' | 'Team';"
);

fs.writeFileSync('src/lib/google/calendar.ts', code);
