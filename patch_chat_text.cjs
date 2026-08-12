const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

// The user might have meant `<span ...>{">"}</span>`
code = code.replace(
  '{">"}</span>',
  '{">"}</span>'
);
