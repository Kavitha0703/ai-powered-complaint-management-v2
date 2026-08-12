const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarMonthView.tsx', 'utf-8');

// Update props
code = code.replace(
  'onDeleteEvent?: (id: string) => void;',
  'onDeleteEvent?: (id: string) => void;\n  onAddEvent?: (date: Date) => void;\n  onAddTask?: (date: Date) => void;'
);

code = code.replace(
  'export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ events, onDeleteEvent }) => {',
  'export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ events, onDeleteEvent, onAddEvent, onAddTask }) => {'
);

// We need to add the buttons under the events list for the selected date
const buttonsCode = `
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
          {onAddEvent && (
            <button
              onClick={() => onAddEvent(selectedDate || new Date())}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-1"
            >
              <span className="text-indigo-400">+</span> Add event
            </button>
          )}
          {onAddTask && (
            <button
              onClick={() => onAddTask(selectedDate || new Date())}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-1"
            >
              <span className="text-emerald-400">+</span> Add task
            </button>
          )}
        </div>
`;

// Insert the buttons right after the closing div of space-y-3
// or inside the empty state. Let's just put it at the very bottom of the "Selected Date Events" section.
const selectedDateSectionEndIdx = code.lastIndexOf('</div>\n    </div>\n  );\n};');
if (selectedDateSectionEndIdx !== -1) {
  code = code.substring(0, selectedDateSectionEndIdx) + buttonsCode + code.substring(selectedDateSectionEndIdx);
}

fs.writeFileSync('src/components/CalendarMonthView.tsx', code);
console.log("Patched CalendarMonthView");
