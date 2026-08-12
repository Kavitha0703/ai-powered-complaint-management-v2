const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// The attendees input is:
//               <div>
//                 <label className="font-semibold text-slate-300 block mb-1">Attendees (comma separated emails)</label>
//                 <input
//                   type="text"
//                   placeholder="john@example.com, sarah@company.com"
//                   value={attendeesInput}
//                   onChange={(e) => setAttendeesInput(e.target.value)}
//                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
//                 />
//               </div>
const attendeesBlock = `              <div>
                <label className="font-semibold text-slate-300 block mb-1">Attendees (comma separated emails)</label>
                <input
                  type="text"
                  placeholder="john@example.com, sarah@company.com"
                  value={attendeesInput}
                  onChange={(e) => setAttendeesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>`;

code = code.replace(attendeesBlock, '');

const doubleDivBlock = `                  ))}
                </div>
              </div>
              </div>`;
const fixedDivBlock = `                  ))}
                </div>
              </div>`;

code = code.replace(doubleDivBlock, fixedDivBlock);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched attendees and divs");
