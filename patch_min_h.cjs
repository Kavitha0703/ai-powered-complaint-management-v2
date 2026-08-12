const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

// Replace flex-1 min-w-0 for the chat window with flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden
code = code.replace(
  '<div id="chat" className="flex-1 min-w-0"><div className="w-full h-full flex flex-col bg-slate-50/10 dark:bg-[#070c15]/5 relative overflow-hidden">',
  '<div id="chat" className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden"><div className="w-full h-full min-h-0 flex flex-col bg-slate-50/10 dark:bg-[#070c15]/5 relative overflow-hidden">'
);

// Replace message feed
code = code.replace(
  'className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 h-full p-4 space-y-4 flex flex-col scrollbar-thin relative min-width-0 justify-start"',
  'className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ scrollbarGutter: "stable" }}'
);

// Also Left and Right sidebars
// ResizablePanel chat_channels (left)
code = code.replace(
  'className="bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B]"',
  'className="bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B] min-h-0"'
);

// ResizablePanel chat_members (right)
code = code.replace(
  'className="bg-slate-50/50 dark:bg-[#070C15]/40 select-none border-l border-slate-200 dark:border-slate-800"',
  'className="bg-slate-50/50 dark:bg-[#070C15]/40 select-none border-l border-slate-200 dark:border-slate-800 min-h-0"'
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched min-h-0");
