const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');
const updated = content
  .replace(/dcms_chat_messages_v3/g, 'dcms_chat_messages_v4')
  .replace(/dcms_chat_rooms_v3/g, 'dcms_chat_rooms_v4');
fs.writeFileSync('src/pages/AdminTeamChat.tsx', updated, 'utf-8');
console.log('updated variants');
