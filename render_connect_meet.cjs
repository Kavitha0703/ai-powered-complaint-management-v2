const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

const target = `{/* GOOGLE MEET CREATION DIALOG */}`;
const injection = `{/* MEET CONNECT DIALOG */}
      {showMeetConnectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Connect Google Meet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Google Meet isn't connected yet. Connect Google Calendar to start meetings.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                 onClick={() => setShowMeetConnectDialog(null)}
                 className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm cursor-pointer"
              >Cancel</button>
              <button 
                 onClick={() => {
                   sessionStorage.setItem("pendingMeetRoomId", showMeetConnectDialog.roomIdToUse);
                   sessionStorage.setItem("pendingMeetTitle", showMeetConnectDialog.title || "");
                   sessionStorage.setItem("pendingMeetParticipants", JSON.stringify(showMeetConnectDialog.participants));
                   googleLogin();
                   setShowMeetConnectDialog(null);
                 }}
                 className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Connect Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE MEET CREATION DIALOG */}`;

content = content.replace(target, injection);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
