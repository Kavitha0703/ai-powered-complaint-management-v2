const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStr = `                  <button
                    onClick={() => {
                      setNewCallType("voice");
                      setNewCallMode("multi");
                      setSelectedParticipantsForNewCall([]);
                      setIsNewCallDialogOpen(true);
                    }}
                    className={\`cursor-pointer p-1.5 rounded-lg text-xs transition-colors \${activeCall && activeCall.type === "voice" ? "bg-emerald-600 text-white animate-pulse" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-105 dark:hover:bg-slate-900"}\`}
                    title={"Start Live Voice Huddle / Audio Bridge"}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setNewCallType("video");
                      setNewCallMode("multi");
                      setSelectedParticipantsForNewCall([]);
                      setIsNewCallDialogOpen(true);
                    }}
                    className={\`cursor-pointer p-1.5 rounded-lg text-xs transition-colors \${activeCall && activeCall.type === "video" ? "bg-indigo-600 text-white animate-pulse" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-105 dark:hover:bg-slate-900"}\`}
                    title={"Start Live Video War Room"}
                  >
                    <Video className="w-4 h-4" />
                  </button>`;

const replacementStr = `                  <button
                    onClick={() => {
                      setIsNewCallDialogOpen(true);
                    }}
                    className={\`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20\`}
                    title={"Create Google Meet"}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Meet</span>
                  </button>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
