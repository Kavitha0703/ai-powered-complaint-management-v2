const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const imports = '\nimport { Button } from "../../components/ui/button.tsx";\nimport { Textarea } from "../../components/ui/textarea.tsx";\nimport { Input } from "../../components/ui/input.tsx";\n';

content = content.replace('import { createGoogleMeet, googleSignIn } from "../lib/GoogleMeetHelper.ts";', 'import { createGoogleMeet, googleSignIn } from "../lib/GoogleMeetHelper.ts";' + imports);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
