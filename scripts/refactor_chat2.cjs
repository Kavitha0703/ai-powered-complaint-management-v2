const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

// Fix the race condition in saveMessagesToStorage
code = code.replace(
  /const saveMessagesToStorage = async \(updatedMessages: ChatMessage\[\]\) => \{[\s\S]*?loadWorkspaceMessages\(\);\n    \n    \/\/ DB Sync diff[\s\S]*?chatDb\.deleteMessage\(old\.id\)\.catch\(console\.error\);\n      \}\n    \}\n  \};/,
  `const saveMessagesToStorage = async (updatedMessages: ChatMessage[]) => {
    const uniqueMap = new Map<string, ChatMessage>();
    updatedMessages.forEach(m => {
      if (m && m.id) uniqueMap.set(m.id, m);
    });
    const deduplicated = Array.from(uniqueMap.values());
    
    const oldMsgs = JSON.parse(localStorage.getItem("dcms_chat_messages_v4") || "[]");
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(deduplicated));
    
    // DB Sync diff
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
  };`
);

// Fix race condition in saveRoomsToStorage
code = code.replace(
  /const saveRoomsToStorage = async \(updatedRooms: ChatRoom\[\]\) => \{[\s\S]*?loadWorkspaceRooms\(\);\n    \n    \/\/ DB Sync diff[\s\S]*?chatDb\.deleteRoom\(old\.id\)\.catch\(console\.error\);\n      \}\n    \}\n  \};/,
  `const saveRoomsToStorage = async (updatedRooms: ChatRoom[]) => {
    const oldRooms = JSON.parse(localStorage.getItem("dcms_chat_rooms_v4") || "[]");
    localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(updatedRooms));
    
    // DB Sync diff
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
    loadWorkspaceRooms();
  };`
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Race condition fix successful!");
