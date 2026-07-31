const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

// The closing tag is </Separator>, let's make it </div>
content = content.replace(/<\/Separator>/g, '</div>');

fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
