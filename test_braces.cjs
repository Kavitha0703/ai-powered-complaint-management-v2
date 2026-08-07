const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');
let open = 0;
for(let i=0; i<content.length; i++) {
    if(content[i] === '{') open++;
    if(content[i] === '}') open--;
    if(open < 0) {
        console.log('Unbalanced closing brace at index', i);
        break;
    }
}
console.log('Final open braces:', open);
