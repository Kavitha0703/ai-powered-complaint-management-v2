const fs = require('fs');
let code = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');

// Change type?: 'Work' | 'Personal' ... to type?: string; to allow any type
code = code.replace(
  /type\?: 'Work' \| 'Personal' \| 'Reminder' \| 'Meeting' \| 'Task' \| 'Important' \| 'Team';/g,
  'type?: string;'
);

code = code.replace(
  /type\?: 'Personal' \| 'Team';/g,
  'type?: string;'
);

fs.writeFileSync('src/lib/google/calendar.ts', code);
console.log("Patched types");
