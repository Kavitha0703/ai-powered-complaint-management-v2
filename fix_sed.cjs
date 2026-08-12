const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');
code = code.replace(/loadWorkspaceMessages\(\);\s+setTimeout\(\(\) => scrollToBottom\("smooth"\), 50\);/g, 'loadWorkspaceMessages();');
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
