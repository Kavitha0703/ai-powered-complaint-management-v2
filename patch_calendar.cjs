const fs = require('fs');
let code = fs.readFileSync('src/lib/google/calendar.ts', 'utf-8');

// Fix duplicate 'priority?:'
code = code.replace(
  "  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';\n  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';",
  "  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';"
);

// Fix eventData lacking priority
const target = `  eventData: {
    summary: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    attendees?: string[];
    addGoogleMeet?: boolean;
    type?: 'Personal' | 'Team';
    visibility?: 'Private' | 'Team';
    color?: string;
    userId?: string;
  }`;

const repl = `  eventData: {
    summary: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    attendees?: string[];
    addGoogleMeet?: boolean;
    type?: 'Personal' | 'Team';
    visibility?: 'Private' | 'Team';
    color?: string;
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
    userId?: string;
  }`;

code = code.replace(target, repl);

fs.writeFileSync('src/lib/google/calendar.ts', code);
