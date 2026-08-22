const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const hookStr = `
  useEffect(() => {
    let timeoutId: any;
    const pollMeet = async () => {
      const accessToken = sessionStorage.getItem("google_workspace_access_token");
      if (!accessToken) {
        timeoutId = setTimeout(pollMeet, 10000);
        return;
      }
      
      let updated = false;
      setMessages(prevMessages => {
        let newMessages = [...prevMessages];
        const activeMeetings = newMessages.filter(m => m.call_summary && m.call_summary.space_name && (m.call_summary.meet_status === "Live" || m.call_summary.meet_status === "Waiting"));
        
        if (activeMeetings.length > 0) {
          // Process asynchronously, but don't block render.
          Promise.all(activeMeetings.map(async (msg) => {
            try {
              const { getConferenceRecords, getParticipants } = await import('../lib/google/meet_api');
              const confRes = await getConferenceRecords(accessToken, msg.call_summary!.space_name!);
              if (confRes.conferenceRecords && confRes.conferenceRecords.length > 0) {
                // Get the latest one
                const latestRecord = confRes.conferenceRecords[0];
                const confName = latestRecord.name;
                
                const partRes = await getParticipants(accessToken, confName);
                const participants = partRes.participants || [];
                const names = participants.map((p: any) => p.signedinUser?.displayName || p.anonymousUser?.displayName || "Anonymous participant");
                
                // Deduplicate names
                const uniqueNames = Array.from(new Set(names)) as string[];
                
                let isEnded = false;
                if (latestRecord.endTime) {
                  isEnded = true;
                }
                
                // Update local storage directly to avoid complex state merge races
                const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
                if (savedMsg) {
                   const msgs = JSON.parse(savedMsg);
                   const idx = msgs.findIndex((m: any) => m.id === msg.id);
                   if (idx !== -1) {
                      msgs[idx].call_summary.joinedParticipants = uniqueNames;
                      msgs[idx].call_summary.conference_record = confName;
                      if (isEnded) {
                        msgs[idx].call_summary.meet_status = "Ended";
                        msgs[idx].call_summary.ended_at = latestRecord.endTime;
                        if (msgs[idx].call_summary.started_at) {
                           const start = new Date(msgs[idx].call_summary.started_at);
                           const end = new Date(latestRecord.endTime);
                           const diff = Math.round((end.getTime() - start.getTime()) / 60000);
                           msgs[idx].call_summary.duration = \`\${diff} minutes\`;
                        }
                      } else {
                        msgs[idx].call_summary.meet_status = "Live";
                      }
                      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(msgs));
                      // Dispatch event for UI reload
                      window.dispatchEvent(new Event("dcms_chat_reload"));
                   }
                }
              }
            } catch (e) {
              console.error("Meet Poll error", e);
            }
          }));
        }
        return prevMessages; // State update is handled by the event listener
      });
      
      timeoutId = setTimeout(pollMeet, 10000); // 10 seconds polling
    };
    
    pollMeet();
    
    const handleReload = () => {
       const saved = localStorage.getItem("dcms_chat_messages_v4");
       if (saved) {
         setMessages(JSON.parse(saved));
       }
    };
    window.addEventListener("dcms_chat_reload", handleReload);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("dcms_chat_reload", handleReload);
    };
  }, []);
`;

code = code.replace("  const [isSelectModeActive, setIsSelectModeActive] = useState(false);", hookStr + "\n  const [isSelectModeActive, setIsSelectModeActive] = useState(false);");

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched polling");
