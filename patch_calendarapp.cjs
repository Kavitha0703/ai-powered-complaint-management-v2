const fs = require('fs');

const content = `import React from 'react';
import { GoogleCalendarPanel } from '../components/GoogleCalendarPanel';

export default function CalendarApp() {
  return (
    <div className="h-[calc(100vh-140px)] w-full overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
      <GoogleCalendarPanel inline={true} />
    </div>
  );
}
`;

fs.writeFileSync('src/pages/CalendarApp.tsx', content);
