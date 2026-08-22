const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

// 1. Add imports
if (!code.includes('import * as chatDb')) {
  code = code.replace(
    'import { supabase } from "../lib/supabase";',
    'import { supabase } from "../lib/supabase";\nimport * as chatDb from "../lib/teamChatDb";'
  );
}

// 2. loadWorkspaceRooms
code = code.replace(
  /const loadWorkspaceRooms = \(\) => \{[\s\S]*?setRooms\(validRooms\);\n  \};/,
  `const loadWorkspaceRooms = async () => {
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
  };`
);

// 3. loadWorkspaceMessages
code = code.replace(
  /const loadWorkspaceMessages = \(\) => \{[\s\S]*?setMessages\(deduplicated\);\n  \};/,
  `const loadWorkspaceMessages = async () => {
    const dbMsgs = await chatDb.getMessages();
    if (dbMsgs) {
      setMessages(dbMsgs.filter(m => !m.deleted_for?.includes(currentAdminId)));
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(dbMsgs));
    } else {
      const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
      if (savedMsg) {
        try {
          const parsed = JSON.parse(savedMsg);
          setMessages(parsed.filter(m => !m.deleted_for?.includes(currentAdminId)));
        } catch(e) {}
      }
    }
  };`
);

// 4. Realtime subscription! We need to add it in useEffect.
// There is an existing useEffect for storage:
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

// 5. Rewrite saveRoomsToStorage to sync ALL rooms? No, it's safer to sync the changed room inside the handlers.
// Wait, `saveRoomsToStorage` is mostly called with a modified array. 
// We can just diff inside `saveRoomsToStorage`!
code = code.replace(
  /const saveRoomsToStorage = \(updatedRooms: ChatRoom\[\]\) => \{[\s\S]*?loadWorkspaceRooms\(\);\n  \};/,
  `const saveRoomsToStorage = async (updatedRooms: ChatRoom[]) => {
    const oldRooms = JSON.parse(localStorage.getItem("dcms_chat_rooms_v4") || "[]");
    localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(updatedRooms));
    loadWorkspaceRooms();
    
    // DB Sync diff
    for (const r of updatedRooms) {
      const old = oldRooms.find((oldR: any) => oldR.id === r.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(r)) {
        chatDb.saveRoom(r).catch(console.error);
      }
    }
    for (const old of oldRooms) {
      if (!updatedRooms.find(r => r.id === old.id)) {
        chatDb.deleteRoom(old.id).catch(console.error);
      }
    }
  };`
);

// 6. Rewrite saveMessagesToStorage to use diffing!
code = code.replace(
  /const saveMessagesToStorage = \(updatedMessages: ChatMessage\[\]\) => \{[\s\S]*?loadWorkspaceMessages\(\);\n  \};/,
  `const saveMessagesToStorage = async (updatedMessages: ChatMessage[]) => {
    const uniqueMap = new Map<string, ChatMessage>();
    updatedMessages.forEach(m => {
      if (m && m.id) uniqueMap.set(m.id, m);
    });
    const deduplicated = Array.from(uniqueMap.values());
    
    const oldMsgs = JSON.parse(localStorage.getItem("dcms_chat_messages_v4") || "[]");
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(deduplicated));
    loadWorkspaceMessages();
    
    // DB Sync diff
    for (const m of deduplicated) {
      const old = oldMsgs.find((oldM: any) => oldM.id === m.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(m)) {
        chatDb.saveMessage(m).catch(console.error);
      }
    }
    for (const old of oldMsgs) {
      if (!deduplicated.find(m => m.id === old.id)) {
        chatDb.deleteMessage(old.id).catch(console.error);
      }
    }
  };`
);

// 7. There are places where `localStorage.setItem("dcms_chat_messages_v4", ...)` is called directly instead of saveMessagesToStorage!
// Let's replace them with `saveMessagesToStorage(...)`!
// example: localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
code = code.replace(
  /localStorage\.setItem\("dcms_chat_messages_v4", JSON\.stringify\(([^)]+)\)\);/g,
  `saveMessagesToStorage($1);`
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Rewrite successful!");
