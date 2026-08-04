const fs = require('fs');
let code = fs.readFileSync('src/lib/google/auth.ts', 'utf8');
code = code.replace(
  /scopes:\s*".*?"/,
  'scopes: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar"'
);
code = code.replace(
  /prompt:\s*"select_account"/,
  'prompt: "consent",\n          access_type: "offline"'
);
fs.writeFileSync('src/lib/google/auth.ts', code);
