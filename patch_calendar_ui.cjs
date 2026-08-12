const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// 1. Remove "Project quiet-alchemy-0lkqp"
code = code.replace(
  '<div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1">\n                Project quiet-alchemy-0lkqp\n              </div>',
  ''
);

// 2. Change modal to be smaller and fix scrolling
// Change outer div from full screen fixed with flex-col to a smaller modal window with no page scrolling

// Instead of replacing blindly, let's use replace with regex for the header text.
code = code.replace(
  /Google Calendar Sync/g,
  'My Calendar'
);
code = code.replace(
  /<p className="text-xs text-slate-400">View & schedule events synced with Google Calendar and Google Meet<\/p>/g,
  '<p className="text-xs text-slate-400">Manage personal and shared events</p>'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched basic strings");
