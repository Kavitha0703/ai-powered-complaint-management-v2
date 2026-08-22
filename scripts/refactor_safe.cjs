const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

if (!code.includes('import * as chatDb')) {
  code = code.replace(
    'import { supabase } from "../lib/supabase";',
    'import { supabase } from "../lib/supabase";\nimport * as chatDb from "../lib/teamChatDb";'
  );
}

// 1. Rewrite loadWorkspaceRooms
const loadRoomsPattern = /const loadWorkspaceRooms = \(\) => \{([\s\S]*?setIsFetchingMeetings\(false\);\n    \}\n  \};)/;
code = code.replace(loadRoomsPattern, `const loadWorkspaceRooms = async () => {
    const dbRooms = await chatDb.getRooms();
    if (dbRooms) {
      setRooms(dbRooms.filter(r => !r.deleted_by_user?.includes(currentAdminId)));
      localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(dbRooms));
    } else {
      const saved = localStorage.getItem("dcms_chat_rooms_v4");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRooms(parsed.filter(r => !r.deleted_by_user?.includes(currentAdminId)));
        } catch(e) {}
      }
    }
  };`);

// 2. Rewrite loadWorkspaceMessages
// It goes from `const loadWorkspaceMessages = () => {` down to `setIsFetchingMeetings(false);\n  };`
const loadMsgsPattern = /const loadWorkspaceMessages = \(\) => \{[\s\S]*?setIsFetchingMeetings\(false\);\n  \};/;
code = code.replace(loadMsgsPattern, `const loadWorkspaceMessages = async () => {
    let loadedMessages: ChatMessage[] = [];
    const dbMsgs = await chatDb.getMessages();
    if (dbMsgs) {
      loadedMessages = dbMsgs;
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(dbMsgs));
    } else {
      const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
      loadedMessages = savedMsg ? JSON.parse(savedMsg) : [];
    }

    const uniqueMsgMap = new Map<string, ChatMessage>();
    loadedMessages.forEach(m => {
      if (m && m.id) {
        uniqueMsgMap.set(m.id, m);
      }
    });
    loadedMessages = Array.from(uniqueMsgMap.values());

    const filtered = loadedMessages.filter(m => m.room_id === activeRoomId && (!m.deleted_for || !m.deleted_for.includes(currentAdminId)));
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const readUpdated = filtered.map(m => {
      if (m.sender_id !== currentAdminId && m.message_status !== "read") {
        return { ...m, message_status: "read" as const };
      }
      return m;
    });
    setMessages(readUpdated);

    // Sync and populate Meeting History state from all logged call messages
    const callMessages = filtered.filter(m => m.call_summary);
    const clearedMeetingsStr = localStorage.getItem("dcms_cleared_meetings") || "[]";
    let clearedMeetings = [];
    try { clearedMeetings = JSON.parse(clearedMeetingsStr); } catch (e) {}
    
    const callHistoryList = callMessages
      .filter(m => !clearedMeetings.includes(m.id))
      .map(m => {
      const summary = m.call_summary;
      const title = summary.title || m.text.replace(/^Created a Google Meet: /, "").replace(/^Scheduled a Google Meet: /, "") || "Google Meet";
      const timestamp = summary.createdAt || m.created_at || m.time;
      const dateObj = new Date(timestamp);
      const formattedTime = isNaN(dateObj.getTime()) ? (m.time || "Recently") : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const durationText = summary.meet_status === "Ended" && summary.duration 
        ? summary.duration 
        : (summary.meet_status === "Live" ? "🟢 Live" : summary.meet_status === "Waiting" ? "🟡 Waiting" : summary.duration || "Google Meet");
      
      const participantsList = (summary.joinedParticipants && summary.joinedParticipants.length > 0)
        ? summary.joinedParticipants
        : (summary.participants && summary.participants.length > 0 ? summary.participants : [summary.organizerName || m.sender_name]);

      return {
        id: m.id,
        type: summary.type || "video",
        title: title,
        participants: participantsList,
        duration: durationText,
        timestamp: formattedTime
      };
    });
    
    setMeetings(callHistoryList);
    setIsFetchingMeetings(false);
  };`);

// 3. Rewrite saveRoomsToStorage
const saveRoomsPattern = /const saveRoomsToStorage = \(updatedRooms: ChatRoom\[\]\) => \{[\s\S]*?setRooms\(updatedRooms\);\n  \};/;
code = code.replace(saveRoomsPattern, `const saveRoomsToStorage = async (updatedRooms: ChatRoom[]) => {
    const oldRooms = JSON.parse(localStorage.getItem("dcms_chat_rooms_v4") || "[]");
    localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(updatedRooms));
    
    const promises = [];
    for (const r of updatedRooms) {
      const old = oldRooms.find((oldR: any) => oldR.id === r.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(r)) {
        promises.push(chatDb.saveRoom(r));
      }
    }
    for (const old of oldRooms) {
      if (!updatedRooms.find(r => r.id === old.id)) {
        promises.push(chatDb.deleteRoom(old.id));
      }
    }
    await Promise.all(promises);
    setRooms(updatedRooms);
  };`);

// 4. Rewrite saveMessagesToStorage
const saveMsgsPattern = /const saveMessagesToStorage = \(updatedMessages: ChatMessage\[\]\) => \{[\s\S]*?window\.dispatchEvent\(new CustomEvent\("dcms_messages_updated"\)\);\n  \};/;
code = code.replace(saveMsgsPattern, `const saveMessagesToStorage = async (updatedMessages: ChatMessage[]) => {
    const uniqueMap = new Map<string, ChatMessage>();
    updatedMessages.forEach(m => {
      if (m && m.id) {
        uniqueMap.set(m.id, m);
      }
    });
    const deduplicated = Array.from(uniqueMap.values());
    const oldMsgs = JSON.parse(localStorage.getItem("dcms_chat_messages_v4") || "[]");
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(deduplicated));
    
    const promises = [];
    for (const m of deduplicated) {
      const old = oldMsgs.find((oldM: any) => oldM.id === m.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(m)) {
        promises.push(chatDb.saveMessage(m));
      }
    }
    for (const old of oldMsgs) {
      if (!deduplicated.find(m => m.id === old.id)) {
        promises.push(chatDb.deleteMessage(old.id));
      }
    }
    await Promise.all(promises);
    loadWorkspaceMessages();
    window.dispatchEvent(new CustomEvent("dcms_messages_updated"));
  };`);

// 5. Add realtime in useEffect
code = code.replace(
  /window\.addEventListener\("storage", handleStorage\);[\s\S]*?return \(\) => \{[\s\S]*?window\.removeEventListener\("storage", handleStorage\);\n    \};/m,
  `window.addEventListener("storage", handleStorage);
    
    // Supabase Realtime for DB sync
    const roomSub = supabase.channel('team_channels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_channels' }, () => {
        loadWorkspaceRooms();
      })
      .subscribe();
      
    const msgSub = supabase.channel('team_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages' }, () => {
        loadWorkspaceMessages();
      })
      .subscribe();

    return () => {
      window.removeEventListener("storage", handleStorage);
      supabase.removeChannel(roomSub);
      supabase.removeChannel(msgSub);
    };`
);

// 6. Direct localStorage updates inside handlers
code = code.replace(
  /localStorage\.setItem\("dcms_chat_messages_v4", JSON\.stringify\(([^)]+)\)\);/g,
  `saveMessagesToStorage($1);`
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Safe rewrite successful!");
