const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarMonthView.tsx', 'utf-8');

const targetStr = `                      {ev.visibility === 'Private' && (
                         <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700 text-[10px] uppercase tracking-wider">
                           <UserIcon className="w-3 h-3 text-slate-400" />
                           Private
                         </span>
                      )}`;

const priorityStr = `                      {ev.priority && (
                         <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700 text-[10px] uppercase tracking-wider">
                           {ev.priority === 'Urgent' ? '🚨' : ev.priority === 'High' ? '⚠️' : ''} {ev.priority}
                         </span>
                      )}`;

code = code.replace(targetStr, targetStr + '\n' + priorityStr);

// Also we should make sure that the Delete button is simple, and maybe add "Edit" button if possible, but edit needs state. Let's just leave Delete.

fs.writeFileSync('src/components/CalendarMonthView.tsx', code);
console.log("Patched CalendarMonthView Priority");
