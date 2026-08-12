const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// Fix 1: createGoogleCalendarEvent arguments
const searchCreate = `const newEv = await createGoogleCalendarEvent(
        summary,
        description,
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString(),
        addMeet
      );`;

const replaceCreate = `const newEv = await createGoogleCalendarEvent({
        summary,
        description,
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        addMeet
      });`;

code = code.replace(searchCreate, replaceCreate);

// Fix 2: Urgent
const searchUrgent = `if (ev.type === 'Important' || ev.type === 'Urgent') return 'red';`;
const replaceUrgent = `if (ev.type === 'Important') return 'red';`;

code = code.replace(searchUrgent, replaceUrgent);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched");
