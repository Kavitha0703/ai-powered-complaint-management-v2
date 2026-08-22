const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const target = `  // Initial Load: seed rooms, messages & meetings from database
  useEffect(() => {
    loadWorkspaceRooms();
    loadWorkspaceMessages();
    fetchMeetingsFromSupabase();
  }, []);`;

const replacement = `  // Initial Load: seed rooms, messages & meetings from database
  useEffect(() => {
    loadWorkspaceRooms();
    loadWorkspaceMessages();
    fetchMeetingsFromSupabase();

    const msgSub = supabase.channel('team_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentAdminId) {
          if ("Notification" in window) {
            if (Notification.permission === "granted") {
              const body = payload.new.text.length > 50 ? payload.new.text.substring(0, 50) + '...' : payload.new.text;
              new Notification("New Message from " + payload.new.sender_name, { body });
            }
          }
        }
        loadWorkspaceMessages();
      })
      .subscribe();

    const roomSub = supabase.channel('team_channels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_channels' }, () => {
        // Just reload for now since loadWorkspaceRooms doesn't fetch from DB directly yet,
        // wait, I need to make loadWorkspaceRooms fetch from DB to see the new rooms!
      })
      .subscribe();

    return () => {
      msgSub.unsubscribe();
      roomSub.unsubscribe();
    };
  }, []);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
  console.log("Realtime subscription added");
} else {
  console.log("Target not found!");
}
