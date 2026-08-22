const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const oldRender = `                              {m.call_summary && (
                                <div className={\`mt-1 mb-2 rounded-xl bg-slate-900 border border-slate-800 shadow-md max-w-sm flex flex-col text-left text-xs animate-fade-in relative overflow-hidden text-white w-full \${isSelf ? 'self-end' : 'self-start'}\`}>
                                  {/* Call Summary Content - Keeping minimal for brevity */}
                                  <div className="flex items-center gap-2 p-3 border-b border-slate-800/80 bg-slate-800/20">
                                    <span className="font-bold text-slate-200">Google Meet</span>
                                  </div>
                                  <div className="p-3">
                                    <div className="font-bold text-sm text-white leading-tight">
                                      {m.call_summary.title || "Google Meet"}
                                    </div>
                                    <div className="mt-2 text-emerald-400 font-medium">
                                      {m.call_summary.meet_status}
                                    </div>
                                  </div>
                                  {m.call_summary.meet_status !== "Ended" && (
                                    <div className="flex items-center border-t border-slate-800/80 bg-slate-950/30">
                                      <button onClick={() => handleJoinGoogleMeet(m.id)} className="flex-1 py-2 text-emerald-400 font-bold border-r border-slate-800/80">Join</button>
                                      <button onClick={() => navigator.clipboard.writeText(m.call_summary?.meet_link || "")} className="flex-1 py-2 text-slate-400 hover:text-white">Copy Link</button>
                                    </div>
                                  )}
                                </div>
                              )}`;

const newRender = `                              {m.call_summary && (
                                <div className={\`mt-1 mb-2 rounded-xl bg-slate-900 border border-slate-800 shadow-md max-w-sm flex flex-col text-left text-xs animate-fade-in relative overflow-hidden text-white w-full \${isSelf ? 'self-end' : 'self-start'}\`}>
                                  <div className="flex items-center gap-2 p-3 border-b border-slate-800/80 bg-slate-800/20">
                                    <span className="font-bold text-slate-200">
                                      {m.call_summary.meet_status !== "Ended" ? "🟢 Google Meet ongoing" : "⚫ Google Meet ended"}
                                    </span>
                                  </div>
                                  <div className="p-3">
                                    <div className="font-bold text-sm text-white leading-tight">
                                      {m.call_summary.title || "Google Meet"}
                                    </div>
                                    <div className="mt-2 text-slate-400 font-medium flex items-center gap-1.5 flex-wrap">
                                      <span>{m.call_summary.joinedParticipants?.length || 0} participants</span>
                                      <span>&middot;</span>
                                      {m.call_summary.meet_status !== "Ended" ? (
                                        <span>Started {m.call_summary.started_at ? new Date(m.call_summary.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : m.time}</span>
                                      ) : (
                                        <>
                                          <span>{m.call_summary.duration}</span>
                                        </>
                                      )}
                                    </div>
                                    {m.call_summary.meet_status === "Ended" && m.call_summary.started_at && m.call_summary.ended_at && (
                                      <div className="mt-1 text-slate-500 font-medium">
                                        {new Date(m.call_summary.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash; {new Date(m.call_summary.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center border-t border-slate-800/80 bg-slate-950/30">
                                    {m.call_summary.meet_status !== "Ended" && (
                                      <button onClick={() => { handleJoinGoogleMeet(m.id); window.open(m.call_summary?.meet_link || "", "_blank"); }} className="flex-1 py-2 text-emerald-400 font-bold border-r border-slate-800/80 cursor-pointer hover:bg-slate-800/50">Join meeting</button>
                                    )}
                                    <button onClick={() => { setParticipantsModalMessage(m); }} className="flex-1 py-2 text-slate-300 font-bold cursor-pointer hover:bg-slate-800/50 hover:text-white">
                                      {m.call_summary.meet_status !== "Ended" ? \`Participants (\${m.call_summary.joinedParticipants?.length || 0})\` : \`View participants (\${m.call_summary.joinedParticipants?.length || 0})\`}
                                    </button>
                                  </div>
                                </div>
                              )}`;

if(code.includes('m.call_summary && (')) {
  code = code.replace(oldRender, newRender);
  fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
  console.log("Patched UI");
} else {
  console.log("Not found UI block");
}
