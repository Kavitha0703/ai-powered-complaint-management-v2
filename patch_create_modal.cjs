const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// 1. Add color state
if (!code.includes('const [eventColor, setEventColor]')) {
  code = code.replace(
    'const [eventVisibility, setEventVisibility] = useState<"Private" | "Team">("Private");',
    'const [eventVisibility, setEventVisibility] = useState<"Private" | "Team">("Private");\n  const [eventColor, setEventColor] = useState<string>("blue");'
  );
}

// 2. Include color in creation
code = code.replace(
  'type: eventType,',
  'type: eventType,\n        color: eventColor,'
);

// 3. Add Color Picker to form
const colorPickerHTML = `
              <div>
                <label className="font-semibold text-slate-300 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {['purple', 'blue', 'emerald', 'yellow', 'orange', 'red', 'pink', 'cyan', 'slate'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEventColor(c)}
                      className={\`w-6 h-6 rounded-full \${eventColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}\`}
                      style={{ backgroundColor: \`var(--color-\${c}-500)\` }}
                    />
                  ))}
                </div>
              </div>
`;
// Wait, tailwind arbitrary var won't work that easily without being defined, so let's use tailwind classes.
const colorPickerTailwind = `
              <div>
                <label className="font-semibold text-slate-300 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">[\s\S]*?<label className="font-semibold text-slate-300 block mb-1">Event Type<\/label>[\s\S]*?<\/select>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `$&
${colorPickerTailwind}
`
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched Calendar Create Event Modal");
