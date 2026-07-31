const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStr = `              <button
                type="button"
                onClick={() => {
                  setSelectedCallDetail(null);
                  setNewCallType(selectedCallDetail.type);
                  setNewCallMode(selectedCallDetail.participants.length > 2 ? "multi" : "direct");
                  const peerNames = selectedCallDetail.participants.filter(name => name !== currentAdminName);
                  const matchedIds = peerNames.map(name => {
                    const found = teammates.find(t => t.name === name);
                    return found ? found.id : null;
                  }).filter((id): id is string => id !== null);
                  setSelectedParticipantsForNewCall(matchedIds);
                  setIsNewCallDialogOpen(true);
                }}
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border-none shadow-lg active:scale-95 duration-100"
              >
                {selectedCallDetail.type === "video" ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {"Re-connect Huddle"}</button>`;

const replacementStr = `              <button
                type="button"
                onClick={() => {
                  setSelectedCallDetail(null);
                  const peerNames = selectedCallDetail.participants.filter(name => name !== currentAdminName);
                  handleCreateGoogleMeet(\`Follow-up: \${selectedCallDetail.title}\`, peerNames);
                }}
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border-none shadow-lg active:scale-95 duration-100"
              >
                <Video className="w-3.5 h-3.5" />
                {"Create Google Meet"}</button>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
