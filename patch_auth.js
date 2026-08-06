const fs = require('fs');
let code = fs.readFileSync('src/lib/google/auth.ts', 'utf8');

// Update scopes
code = code.replace(
  'scopes: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar",',
  'scopes: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/calendar.events",'
);

fs.writeFileSync('src/lib/google/auth.ts', code);
