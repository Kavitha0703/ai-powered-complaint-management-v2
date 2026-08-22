const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const modalUI = `
      {/* PARTICIPANTS MODAL */}
      {participantsModalMessage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setParticipantsModalMessage(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                Participants
              </h2>
              <p className="text-xs text-slate-400 mt-1">{participantsModalMessage.call_summary?.title}</p>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {participantsModalMessage.call_summary?.joinedParticipants?.length ? (
                participantsModalMessage.call_summary.joinedParticipants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {p.charAt(0)}
                    </div>
                    <div className="text-sm text-slate-200 font-semibold truncate">{p}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No participants yet
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <button 
                 onClick={() => setParticipantsModalMessage(null)}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl p-3 text-sm transition-colors cursor-pointer"
              >
                 Close
              </button>
            </div>
          </div>
        </div>
      )}

`;

code = code.replace("{isNewCallDialogOpen && (", modalUI + "{isNewCallDialogOpen && (");

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Modal patched");
