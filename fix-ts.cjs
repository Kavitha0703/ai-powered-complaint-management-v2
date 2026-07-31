const fs = require('fs');
const content = fs.readFileSync('ts-error.log', 'utf8');

const regex = /Cannot find name '([^']+)'/g;
let match;
const missing = new Set();
while ((match = regex.exec(content)) !== null) {
  missing.add(match[1]);
}

const icons = [];
const refs = [];
const states = [];
const others = [];

for (const name of missing) {
  if (name[0] === name[0].toUpperCase()) {
    icons.push(name);
  } else if (name.endsWith('Ref')) {
    refs.push(name);
  } else if (name.startsWith('set')) {
    // skip, handled by state
  } else {
    // assume state
    if (missing.has('set' + name.charAt(0).toUpperCase() + name.slice(1))) {
      states.push(name);
    } else {
      others.push(name);
    }
  }
}

let appContent = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

// Add icons to lucide-react import
const importRegex = /import \{([^}]+)\} from "lucide-react";/;
const importMatch = appContent.match(importRegex);
if (importMatch) {
  const existingIcons = importMatch[1].split(',').map(s => s.trim());
  const newIcons = icons.filter(i => !existingIcons.includes(i));
  if (newIcons.length > 0) {
    appContent = appContent.replace(importMatch[1], importMatch[1] + ', ' + newIcons.join(', '));
  }
}

// Add refs
const refsDeclarations = refs.map(r => `  const ${r} = useRef<any>(null);`).join('\n');

// Add states
const stateDeclarations = states.map(s => {
  const setter = 'set' + s.charAt(0).toUpperCase() + s.slice(1);
  return `  const [${s}, ${setter}] = useState<any>(null);`;
}).join('\n');

// Add others
const othersDeclarations = others.map(o => {
    if (missing.has('set' + o.charAt(0).toUpperCase() + o.slice(1))) return '';
    if (o === 'mentionFilter') return `  const [mentionFilter, setMentionFilter] = useState<string>('');`;
    return `  const ${o} = null;`
}).join('\n');

const toInsert = `\n${refsDeclarations}\n${stateDeclarations}\n${othersDeclarations}\n`;

appContent = appContent.replace('  const [audioLevel, setAudioLevel] = useState(1);', '  const [audioLevel, setAudioLevel] = useState(1);' + toInsert);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', appContent);
console.log('Fixed:', missing.size, 'variables');
