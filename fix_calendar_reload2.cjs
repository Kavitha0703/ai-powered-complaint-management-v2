const fs = require('fs');
let content = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

content = content.replace('loadEvents(); // Reload events from Google Calendar to ensure sync', 'window.location.reload(); // Reload page to ensure sync');
content = content.replace('loadEvents(); // Reload events from Google Calendar to ensure sync', 'window.location.reload(); // Reload page to ensure sync');

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', content);
