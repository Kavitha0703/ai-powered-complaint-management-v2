const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarMonthView.tsx', 'utf-8');

// The original UI has 'relative h-12 sm:h-16 rounded-xl flex flex-col items-center ... border bg-indigo-500/10'
// We want the box to be borderless and transparent, and just a circle behind the day text when selected.

const targetDiv = `              <div 
                key={\`day-\${day}\`}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={\`
                  relative h-12 sm:h-16 rounded-xl flex flex-col items-center p-1 sm:p-1.5 cursor-pointer transition-all border
                  \${isSelected ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60'}
                \`}
              >
                <span className={\`text-xs font-bold \${isToday ? 'text-indigo-400' : 'text-slate-300'}\`}>
                  {day}
                </span>`;

const newDiv = `              <div 
                key={\`day-\${day}\`}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className="relative h-12 sm:h-16 flex flex-col items-center justify-start p-1 cursor-pointer transition-all hover:bg-slate-800/40 rounded-lg group"
              >
                <div className={\`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold \${isSelected ? 'bg-indigo-500 text-white shadow-md' : isToday ? 'text-indigo-400' : 'text-slate-300 group-hover:text-white'}\`}>
                  {day}
                </div>`;

code = code.replace(targetDiv, newDiv);

// Make grid gap smaller or remove border of grid to make it cleaner
// Actually bg-slate-950/40 is fine, but maybe change the background of calendar grid.
code = code.replace(
  'className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800"',
  'className="bg-slate-950/30 p-2 sm:p-4 rounded-2xl border border-slate-800/60"'
);

fs.writeFileSync('src/components/CalendarMonthView.tsx', code);
console.log("Patched CalendarMonthView Grid UI");
