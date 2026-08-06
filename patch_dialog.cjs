const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStrStart = '      {/* GOOGLE MEET CREATION DIALOG */}';
const targetStrEnd = '      {/* Join Google Meet Email Confirmation Modal */}';

const startIndex = code.indexOf(targetStrStart);
const endIndex = code.indexOf(targetStrEnd);

const replacement = `      {/* GOOGLE MEET CREATION DIALOG */}
      {isNewCallDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsNewCallDialogOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-emerald-400" />
                Google Meet
              </h2>
              <p className="text-xs text-slate-400 mt-1">Choose how you want to connect.</p>
            </div>
            
            <div className="space-y-3">
              <button 
                 onClick={() => {
                     const participants = teammates.filter(t => t.id !== currentAdminId).map(t => t.name);
                     handleCreateGoogleMeet('Team Sync', participants);
                     setIsNewCallDialogOpen(false);
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                   <Video className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Start Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Create a new meeting instantly</div>
                 </div>
              </button>

              <button 
                 onClick={() => {
                     const link = prompt("Paste your Google Meet link (e.g. https://meet.google.com/abc-defg-hij)");
                     if (link && link.includes("meet.google.com")) {
                       handleSend(link);
                       setIsNewCallDialogOpen(false);
                     }
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                   <LinkIcon className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Share Existing Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Paste a meet.google.com link</div>
                 </div>
              </button>

              <button 
                 onClick={() => {
                     window.open("https://calendar.google.com/calendar/u/0/r/eventedit", "_blank");
                     setIsNewCallDialogOpen(false);
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                   <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Schedule Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Create an event in Google Calendar</div>
                 </div>
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  // Ensure LinkIcon is imported (wait, we have Link in lucide-react, I should check the imports)
  code = code.replace(/LinkIcon/g, 'Link2');
  if(!code.includes('Link2')) {
      code = code.replace(/import \{([^}]+)\} from "lucide-react"/, 'import {$1, Link2} from "lucide-react"');
  }
  fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find boundaries");
}
