const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// The original Schedule Event button is in the "Action bar" we need to remove it
// Wait, the action bar has:
/*
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Upcoming Events ({events.length})</h4>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        </div>
*/
// Replace the Action bar with nothing, or maybe keep just the title if we want, or remove the entire thing.
// We'll remove the whole block.
const actionbarRegex = /<div className="flex items-center justify-between">[\s\S]*?<h4[\s\S]*?Upcoming Events[\s\S]*?<\/h4>[\s\S]*?<button[\s\S]*?setShowCreateModal[\s\S]*?Schedule Event[\s\S]*?<\/button>[\s\S]*?<\/div>/;
code = code.replace(actionbarRegex, '');

// Update CalendarMonthView invocation
code = code.replace(
  '<CalendarMonthView \n          events={events}\n          onDeleteEvent={(id) => setDeleteConfirmId(id)}\n        />',
  `<CalendarMonthView 
          events={events}
          onDeleteEvent={(id) => setDeleteConfirmId(id)}
          onAddEvent={(date) => {
            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setStartDate(dateStr);
            setEndDate(dateStr);
            setShowCreateModal(true);
          }}
          // Add Task currently maps to add event with "Personal" as type for now, or just show modal
          onAddTask={(date) => {
            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setStartDate(dateStr);
            setEndDate(dateStr);
            setEventType("Personal");
            setShowCreateModal(true);
          }}
        />`
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched GoogleCalendarPanel CalendarMonthView props");
