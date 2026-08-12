const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarMonthView.tsx', 'utf-8');

const targetDiv = `              <div 
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

const newDiv = `              <div 
                key={\`day-\${day}\`}
                onClick={() => {
                  const clickedDate = new Date(year, month, day);
                  if (isSelected) {
                    if (onAddEvent) onAddEvent(clickedDate);
                  } else {
                    setSelectedDate(clickedDate);
                  }
                }}
                onDoubleClick={() => {
                  const clickedDate = new Date(year, month, day);
                  setSelectedDate(clickedDate);
                  if (onAddEvent) onAddEvent(clickedDate);
                }}
                className="relative h-12 flex flex-col items-center justify-start p-1 cursor-pointer transition-all hover:bg-slate-800/40 rounded-lg group select-none"
              >
                <div className={\`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold \${isSelected ? 'bg-indigo-600 text-white shadow-md' : isToday ? 'border border-slate-500 text-slate-300' : 'text-slate-300 group-hover:text-white'}\`}>
                  {day}
                </div>`;

code = code.replace(targetDiv, newDiv);
fs.writeFileSync('src/components/CalendarMonthView.tsx', code);
console.log("Patched CalendarMonthView single/double click");
