const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStr = `  const [teammates, setTeammates] = useState<Teammate[]>(() => {
    const invites = getAdminInvites().filter(i => i.status === "Active");
    return [
      ...HARDCODED_ADMINS.map(a => ({ id: a.id, name: a.name || a.email.split('@')[0], role: a.role, avatar: "👤", status: a.is_online ? "online" as const : "offline" as const })),
      ...invites.map(i => ({ id: "usr_" + i.id, name: i.name || i.email.split('@')[0], role: i.role, avatar: "👤", status: "offline" as const }))
    ];
  });`;

const replacementStr = `  const [teammates, setTeammates] = useState<Teammate[]>(() => {
    const invites = getAdminInvites().filter(i => i.status === "Active");
    const allUsers = [
      ...HARDCODED_ADMINS.map(a => ({ id: a.id, name: a.name || a.email.split('@')[0], role: a.role, avatar: "👤", status: a.is_online ? "online" as const : "offline" as const })),
      ...invites.map(i => ({ id: "usr_" + i.id, name: i.name || i.email.split('@')[0], role: i.role, avatar: "👤", status: "offline" as const }))
    ];
    // Exclude the currently logged in user so they don't see themselves in invite lists or team directories
    const currentAdminIdFallback = dbUser?.id || "usr_kavitha";
    return allUsers.filter(u => u.id !== currentAdminIdFallback && !u.id.includes(currentAdminIdFallback) && !currentAdminIdFallback.includes(u.id));
  });`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
