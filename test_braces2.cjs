const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');
const startIdx = content.indexOf('export default function AdminTeamChat() {');
let open = 0;
let started = false;
for(let i=startIdx; i<content.length; i++) {
    if(content[i] === '{') { open++; started = true; }
    if(content[i] === '}') { open--; }
    if(started && open === 0) {
        console.log('Component closes at line', content.substring(0, i).split('\n').length);
        break;
    }
}
