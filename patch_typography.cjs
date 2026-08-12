const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

// The main message text is rendered. We can search for where it renders the message.
// Let's find: m.text
// And: m.sender_name
