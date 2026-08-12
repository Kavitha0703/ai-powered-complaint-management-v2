const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarMonthView.tsx', 'utf-8');

// The day render block
const targetDiv = `              <div 
                key={\`day-\${day}\`}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className="relative h-12 sm:h-16 flex flex-col items-center justify-start p-1 cursor-pointer transition-all hover:bg-slate-800/40 rounded-lg group"
              >
                <div className={\`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold \${isSelected ? 'bg-indigo-500 text-white shadow-md' : isToday ? 'text-indigo-400' : 'text-slate-300 group-hover:text-white'}\`}>
                  {day}
                </div>`;

const newDiv = `              <div 
                key={\`day-\${day}\`}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                onDoubleClick={() => {
                  setSelectedDate(new Date(year, month, day));
                  if (onAddEvent) onAddEvent(new Date(year, month, day));
                }}
                // Add touch support for double tap using a simple tracking state or just assume double click for now?
                // Double click works reasonably on most browsers if configured.
                className="relative h-12 flex flex-col items-center justify-start p-1 cursor-pointer transition-all hover:bg-slate-800/40 rounded-lg group select-none"
              >
                <div className={\`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold \${isSelected ? 'bg-indigo-600 text-white shadow-md' : isToday ? 'border border-slate-500 text-slate-300' : 'text-slate-300 group-hover:text-white'}\`}>
                  {day}
                </div>`;

code = code.replace(targetDiv, newDiv);

// Now change `h-12 sm:h-16` of empty cells to just `h-12`
code = code.replace(
  'className="h-12 sm:h-16"',
  'className="h-12"'
);

fs.writeFileSync('src/components/CalendarMonthView.tsx', code);
console.log("Patched CalendarMonthView Grid UI 2");
