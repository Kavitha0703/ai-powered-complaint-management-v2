const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const target = `  // Load Rooms
  const loadWorkspaceRooms = () => {
    const saved = localStorage.getItem("dcms_chat_rooms_v4");
    let loadedRooms: ChatRoom[] = saved ? JSON.parse(saved) : [];
    setRooms(loadedRooms);
    
    setActiveRoomId(prev => {
        if (!prev && loadedRooms.length > 0) return loadedRooms[0].id;
        if (prev && !loadedRooms.find(r => r.id === prev)) return loadedRooms.length > 0 ? loadedRooms[0].id : null;
        return prev;
    });
  };`;

const replacement = `  // Load Rooms
  const loadWorkspaceRooms = async () => {
    let loadedRooms: ChatRoom[] = [];
    const dbRooms = await chatDb.getRooms();
    if (dbRooms) {
      loadedRooms = dbRooms;
      localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(dbRooms));
    } else {
      const saved = localStorage.getItem("dcms_chat_rooms_v4");
      loadedRooms = saved ? JSON.parse(saved) : [];
    }

    setRooms(loadedRooms);
    
    setActiveRoomId(prev => {
        if (!prev && loadedRooms.length > 0) return loadedRooms[0].id;
        if (prev && !loadedRooms.find(r => r.id === prev)) return loadedRooms.length > 0 ? loadedRooms[0].id : null;
        return prev;
    });
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  
  // also fix the roomSub to actually call loadWorkspaceRooms
  const roomSubTarget = `    const roomSub = supabase.channel('team_channels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_channels' }, () => {
        // Just reload for now since loadWorkspaceRooms doesn't fetch from DB directly yet,
        // wait, I need to make loadWorkspaceRooms fetch from DB to see the new rooms!
      })
      .subscribe();`;
  
  const roomSubReplacement = `    const roomSub = supabase.channel('team_channels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_channels' }, () => {
        loadWorkspaceRooms();
      })
      .subscribe();`;

  code = code.replace(roomSubTarget, roomSubReplacement);

  fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
  console.log("Rooms fixed");
} else {
  console.log("Target not found!");
}
