const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStr = content.substring(content.indexOf('{m.call_summary && ('), content.indexOf('                           )}', content.indexOf('{m.call_summary && (')) + 29);

const replacementStr = `{m.call_summary && (
                             <div className="mb-3 p-3.5 rounded-2xl bg-slate-905 border border-slate-800 shadow-xl max-w-sm flex flex-col gap-2.5 text-left text-xs animate-fade-in relative overflow-hidden text-white bg-slate-900">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Video className="w-4 h-4 text-indigo-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-white">Google Meet</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{m.text.replace("Scheduled a Google Meet: ", "")}</p>
                                  </div>
                               </div>

                               <div className="flex flex-wrap gap-1 mt-2 border-b border-slate-800 pb-3">
                                   {m.call_summary.participants.map((person, idx) => (
                                     <span key={idx} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                       {person}
                                     </span>
                                   ))}
                               </div>
                               
                               <div className="flex items-center justify-between">
                                  {(() => {
                                      const status = m.call_summary.meet_status || "Scheduled";
                                      let colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                      if (status === "Live Now" || status === "Live") colorClass = "bg-green-500/10 text-green-400 border-green-500/20";
                                      if (status === "Ending Soon") colorClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                                      if (status === "Ended") colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                                      if (status === "Cancelled" || status === "Connection Failed") colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
                                      if (status === "Recording Processing") colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                                      
                                      return (
                                        <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold border \${colorClass}\`}>
                                            {status}
                                        </span>
                                      );
                                  })()}
                                  
                                  {m.call_summary.meet_link && (m.call_summary.meet_status === "Scheduled" || m.call_summary.meet_status === "Live" || !m.call_summary.meet_status) && (
                                     <a href={m.call_summary.meet_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-[0_0_10px_rgba(79,70,229,0.3)] flex items-center gap-1 cursor-pointer">
                                        <Video className="w-3 h-3" />
                                        Join Meeting
                                     </a>
                                  )}
                               </div>
                             </div>
                           )}`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
