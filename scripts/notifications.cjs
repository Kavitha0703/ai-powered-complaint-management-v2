const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(
  /const msgSub = supabase\.channel\('team_messages_changes'\)[\s\S]*?\.subscribe\(\);/,
  `const msgSub = supabase.channel('team_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentAdminId) {
          if ("Notification" in window) {
            if (Notification.permission === "granted") {
              const body = payload.new.text.length > 50 ? payload.new.text.substring(0, 50) + '...' : payload.new.text;
              new Notification("New Message from " + payload.new.sender_name, { body });
            } else if (Notification.permission !== "denied") {
              Notification.requestPermission();
            }
          }
        }
        loadWorkspaceMessages();
      })
      .subscribe();`
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
