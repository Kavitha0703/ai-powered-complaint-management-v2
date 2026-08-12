const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

if (!code.includes('eventPriority')) {
  code = code.replace(
    "const [eventColor, setEventColor] = useState<string>('blue');",
    "const [eventColor, setEventColor] = useState<string>('blue');\n  const [eventPriority, setEventPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');"
  );
  
  // Add priority to creation
  code = code.replace(
    "color: eventColor,",
    "color: eventColor,\n        priority: eventPriority,"
  );
}

// Update color picker
const colorPickerOld = `                <div className="flex flex-wrap gap-2">
                  {[
                    {name: 'purple', bg: 'bg-purple-500'},
                    {name: 'blue', bg: 'bg-blue-500'},
                    {name: 'emerald', bg: 'bg-emerald-500'},
                    {name: 'yellow', bg: 'bg-yellow-500'},
                    {name: 'orange', bg: 'bg-orange-500'},
                    {name: 'red', bg: 'bg-red-500'},
                    {name: 'pink', bg: 'bg-pink-500'},
                    {name: 'cyan', bg: 'bg-cyan-500'},
                    {name: 'slate', bg: 'bg-slate-500'}
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setEventColor(c.name)}
                      className={\`w-6 h-6 rounded-full cursor-pointer \${c.bg} \${eventColor === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}\`}
                    />
                  ))}
                </div>`;

const colorPickerNew = `                <div className="flex flex-wrap gap-2">
                  {[
                    {name: 'red', bg: 'bg-red-500'},
                    {name: 'orange', bg: 'bg-orange-500'},
                    {name: 'yellow', bg: 'bg-yellow-500'},
                    {name: 'emerald', bg: 'bg-emerald-500'},
                    {name: 'blue', bg: 'bg-blue-500'},
                    {name: 'purple', bg: 'bg-purple-500'},
                    {name: 'pink', bg: 'bg-pink-500'},
                    {name: 'cyan', bg: 'bg-cyan-500'},
                    {name: 'indigo', bg: 'bg-indigo-500'},
                    {name: 'amber', bg: 'bg-amber-500'},
                    {name: 'gray', bg: 'bg-gray-500'},
                    {name: 'slate', bg: 'bg-slate-500'}
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setEventColor(c.name)}
                      className={\`w-6 h-6 rounded-full cursor-pointer \${c.bg} \${eventColor === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}\`}
                    />
                  ))}
                </div>`;

code = code.replace(colorPickerOld, colorPickerNew);

// Add priority picker
const priorityPicker = `
              <div>
                <label className="font-semibold text-slate-300 block mb-2">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={eventPriority === p}
                        onChange={(e) => setEventPriority(e.target.value as any)}
                        className="w-3.5 h-3.5 accent-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
`;

code = code.replace(
  '              <div>\n                <label className="font-semibold text-slate-300 block mb-2">Color</label>',
  priorityPicker + '\n              <div>\n                <label className="font-semibold text-slate-300 block mb-2">Color</label>'
);

// Reset form
code = code.replace(
  'setEventColor("blue");\n      loadEvents();',
  'setEventColor("blue");\n      setEventPriority("Normal");\n      loadEvents();'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched Calendar Create Event Modal Add Priority");
