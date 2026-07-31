const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetButtonsGroupStr = `                          <button
                            onClick={() => startCall("voice", selectedTeammatesForCall.length > 1 ? "multi" : "direct", selectedTeammatesForCall)}
                            className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title={"Start voice bridge with selected"}
                          >
                            <Phone className="w-2.5 h-2.5" />
                            {"Voice"}</button>
                          <button
                            onClick={() => startCall("video", selectedTeammatesForCall.length > 1 ? "multi" : "direct", selectedTeammatesForCall)}
                            className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title={"Start video war-room with selected"}
                          >
                            <Video className="w-2.5 h-2.5" />
                            {"Video"}</button>`;

const replacementButtonsGroupStr = `                          <button
                            onClick={() => {
                                const title = "Team Sync";
                                const participants = teammates.filter(t => selectedTeammatesForCall.includes(t.id)).map(t => t.name);
                                handleCreateGoogleMeet(title, participants);
                            }}
                            className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title={"Create Google Meet with selected"}
                          >
                            <Video className="w-2.5 h-2.5" />
                            {"Meet"}</button>`;

content = content.replace(targetButtonsGroupStr, replacementButtonsGroupStr);

const targetIndividualButtonsStr = `                            {/* Fast Direct Call buttons (with WebRTC logic) */}
                            <button
                              onClick={() => startCall("voice", "direct", [m.id])}
                              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={\`Direct Audio Call to \${m.name}\`}
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => startCall("video", "direct", [m.id])}
                              className="p-1 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={\`Direct Video Call to \${m.name}\`}
                            >
                              <Video className="w-3 h-3" />
                            </button>`;

const replacementIndividualButtonsStr = `                            {/* Fast Direct Call buttons */}
                            <button
                              onClick={() => {
                                 handleCreateGoogleMeet("Quick Sync", [m.name]);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={\`Create Google Meet with \${m.name}\`}
                            >
                              <Video className="w-3 h-3" />
                            </button>`;

content = content.replace(targetIndividualButtonsStr, replacementIndividualButtonsStr);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
