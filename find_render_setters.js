const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const lines = content.split('\n');
let insideHook = 0;
let insideCallback = 0;
let inReturn = false;

lines.forEach((line, index) => {
    if (line.includes('useEffect(() =>') || line.includes('useCallback(() =>')) {
        insideHook++;
    }
    if (line.includes('const ') && line.includes(' = () => {')) {
        insideCallback++;
    }
    if (line.includes('function ') && line.includes('() {')) {
        insideCallback++;
    }
    if (line.match(/const handle[a-zA-Z0-9]+ =/)) {
        insideCallback++;
    }
    
    // Very naive bracket counting is too hard. 
    // Let's just regex for set[A-Z] that is at the root of the component.
});
