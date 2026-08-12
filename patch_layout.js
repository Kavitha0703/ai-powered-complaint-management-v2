const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(
  /<div className="flex flex-row w-full h-full overflow-hidden">/,
  '<PanelGroup direction="horizontal" autoSaveId="dcms-workspace-layout" className="flex flex-row w-full h-full overflow-hidden">'
);

// Close PanelGroup at the end of the flex-row div
// Since it's hard to match closing tags precisely, I'll find it by searching for the end of PANEL 4
code = code.replace(
  /(\{\/\* ---------------------------------------------------------------- \*\/\}\s*\{\/\* FOOTER \(Hidden on mobile\) \*\/\})/,
  '</PanelGroup>\n          $1'
);

// We need to wrap PANEL 2, PANEL 3, and PANEL 4 in <Panel>
// And replace the fake resize handles with <PanelResizeHandle>

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
