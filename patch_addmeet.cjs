const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

code = code.replace(
  'addMeet\\n      });',
  'addGoogleMeet: addMeet\\n      });'
);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
