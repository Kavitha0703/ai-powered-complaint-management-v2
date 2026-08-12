const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// I want to change `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">` before Visibility to just `<div className="flex flex-col gap-4">` or something, or I can just remove it.
const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\s*<div>\s*<label className="font-semibold text-slate-300 block mb-1">Visibility<\/label>/;
code = code.replace(regex, '<div>\n                  <label className="font-semibold text-slate-300 block mb-1">Visibility</label>');

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched layout structure for Visibility");
