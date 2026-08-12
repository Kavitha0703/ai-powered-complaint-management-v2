const fs = require('fs');
let code = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');

if (!code.includes('priority?:')) {
  code = code.replace(
    "color?: string;",
    "color?: string;\n  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';"
  );
  code = code.replace(
    "color?: string;",
    "color?: string;\n    priority?: 'Low' | 'Normal' | 'High' | 'Urgent';"
  );
  code = code.replace(
    "color: eventData.color || 'blue',",
    "color: eventData.color || 'blue',\n    priority: eventData.priority || 'Normal',"
  );
  fs.writeFileSync('src/lib/google/calendar.ts', code);
  console.log("Patched src/lib/google/calendar.ts");
}
