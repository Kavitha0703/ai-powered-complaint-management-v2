const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');
content = content.replace('defaultNS: \'common\',', 'defaultNS: \'common\',\n    nsSeparator: \'.\',\n    keySeparator: \':\',');
fs.writeFileSync('src/i18n.ts', content);
