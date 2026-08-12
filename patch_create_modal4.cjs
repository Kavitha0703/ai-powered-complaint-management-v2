const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// Remove Event Type
const typeRegex = /<div>\s*<label className="font-semibold text-slate-300 block mb-1">Event Type<\/label>[\s\S]*?<\/select>\s*<\/div>/;
code = code.replace(typeRegex, '');

// Also remove description and attendees input
const descRegex = /<div>\s*<label className="font-semibold text-slate-300 block mb-1">Description<\/label>[\s\S]*?<\/textarea>\s*<\/div>/;
code = code.replace(descRegex, '');

const attendeesRegex = /<div>\s*<label className="font-semibold text-slate-300 block mb-1">Invite Attendees <span className="text-slate-500 font-normal">\(optional\)<\/span><\/label>[\s\S]*?<\/input>\s*<\/div>/;
code = code.replace(attendeesRegex, '');

// Simplify the header title
code = code.replace('Schedule Google Calendar Event', 'Create Event');
code = code.replace('{isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}\n                Add to Google Calendar', '{isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}\n                Save Event');

// Make the layout single column since we removed the other element in the grid
code = code.replace('<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                <div>\n                  <label className="font-semibold text-slate-300 block mb-1">Visibility', 
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                <div>\n                  <label className="font-semibold text-slate-300 block mb-1">Visibility'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched Create Event Modal");
