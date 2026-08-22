const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');
const lines = content.split('\n');

const result = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dcms_chat_messages_v4') || lines[i].includes('saveMessagesToStorage')) {
    result.push(`${i + 1}: ${lines[i]}`);
  }
}
console.log(result.join('\n'));
